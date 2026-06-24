import { NetlifyAPI } from 'netlify';
import JSZip from 'jszip';
import { generateAllWebsiteFiles } from '../../client/src/lib/dynamic-website-generator.js';

interface DeploymentResult {
  url: string;
  ssl_url?: string;
  name: string;
  deploy_id: string;
  admin_url: string;
}

function applyVersionedAssetUrlsToHtmlFiles(
  files: Record<string, string>,
  versionToken: string
): Record<string, string> {
  const versionedFiles: Record<string, string> = { ...files };

  for (const [filename, content] of Object.entries(files)) {
    if (!filename.toLowerCase().endsWith(".html")) continue;
    if (typeof content !== "string" || !content.trim()) continue;

    versionedFiles[filename] = content
      .replace(
        /href=(['"])([^'"]*styles\.css)(?:\?[^'"]*)?\1/gi,
        (_match, quote: string, assetPath: string) => `href=${quote}${assetPath}?v=${versionToken}${quote}`
      )
      .replace(
        /src=(['"])([^'"]*script\.js)(?:\?[^'"]*)?\1/gi,
        (_match, quote: string, assetPath: string) => `src=${quote}${assetPath}?v=${versionToken}${quote}`
      );
  }

  return versionedFiles;
}

export async function deployToNetlify(
  files: Record<string, string>,
  accessToken: string,
  siteName: string,
  businessData?: any,
  template?: string
): Promise<DeploymentResult> {
  try {
    const netlify = new NetlifyAPI(accessToken);

    // Check if site already exists by name
    let site = await getSiteByName(accessToken, siteName);

    // Create site if it doesn't exist
    if (!site) {
      console.log(`Creating new Netlify site: ${siteName}`);
      site = await netlify.createSite({
        body: {
          name: siteName,
        }
      });
      console.log(`Created site with ID: ${site.id}`);

      // If we have business data and template, regenerate files with correct domain
      if (businessData && template) {
        const siteUrl = `https://${siteName}.netlify.app`;
        console.log(`Regenerating files with correct domain: ${siteUrl}`);
        console.log(`Regenerating for business: ${businessData.businessName || 'Unknown'} with template: ${template}`);
        const updatedFiles = generateAllWebsiteFiles(businessData, template, siteUrl);

        // Log specific SEO files to confirm they have correct URLs
        console.log('Generated robots.txt preview:', updatedFiles['robots.txt']?.substring(0, 200));
        console.log('Generated sitemap.xml preview:', updatedFiles['sitemap.xml']?.substring(0, 200));

        // Replace files with corrected SEO files
        Object.assign(files, updatedFiles);
      }
    } else {
      console.log(`Using existing site: ${site.name} (${site.id})`);

      // For existing sites, also regenerate files with correct domain if business data is provided
      if (businessData && template) {
        // Use the site's actual URL or construct it properly
        const siteUrl = site.ssl_url || site.url || `https://${site.name}.netlify.app`;
        console.log(`Regenerating files for existing site with correct domain: ${siteUrl}`);
        console.log(`Regenerating for business: ${businessData.businessName || 'Unknown'} with template: ${template}`);
        const updatedFiles = generateAllWebsiteFiles(businessData, template, siteUrl);

        // Log specific SEO files to confirm they have correct URLs
        console.log('Generated robots.txt preview:', updatedFiles['robots.txt']?.substring(0, 200));
        console.log('Generated sitemap.xml preview:', updatedFiles['sitemap.xml']?.substring(0, 200));

        // Replace files with corrected SEO files
        Object.assign(files, updatedFiles);
      }
    }

    // Bust stale browser caches on every deploy by versioning CSS/JS URLs in all HTML files.
    const deploymentVersionToken = Date.now().toString(36);
    const deployFiles = applyVersionedAssetUrlsToHtmlFiles(files, deploymentVersionToken);

    // Create ZIP file AFTER ensuring files have correct domain
    const zip = new JSZip();
    Object.entries(deployFiles).forEach(([filename, content]) => {
      zip.file(filename, content);
    });

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // Deploy the files
    console.log(`Deploying ${Object.keys(deployFiles).length} files to site ${site.id}`);
    console.log('Files being deployed:', Object.keys(deployFiles));

    // Deploy using ZIP file method - use direct HTTP request for ZIP upload
    const response = await fetch(`https://api.netlify.com/api/v1/sites/${site.id}/deploys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/zip',
      },
      body: new Uint8Array(zipBuffer) as any,
    });

    if (!response.ok) {
      throw new Error(`Deployment failed: ${response.status} ${response.statusText}`);
    }

    const deploy = await response.json();

    console.log(`Deployment created with ID: ${deploy.id}`);
    console.log(`Deploy state: ${deploy.state}`);
    console.log(`Deploy URL: ${deploy.deploy_ssl_url || deploy.deploy_url}`);

    // Wait for deployment to complete and ensure it's published
    let deployStatus = deploy;
    let attempts = 0;
    while ((deployStatus.state === 'building' || deployStatus.state === 'processing') && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      deployStatus = await netlify.getSiteDeploy({
        siteId: site.id || '',
        deployId: deploy.id || ''
      });
      console.log(`Deploy status check ${attempts + 1}: ${deployStatus.state}`);
      attempts++;
    }

    // If deployment is ready, try to publish it
    if (deployStatus.state === 'ready') {
      try {
        // The deployment should automatically be live if draft: false
        console.log(`Deploy completed successfully with state: ${deployStatus.state}`);
      } catch (publishError) {
        console.log('Publish error (might already be published):', publishError);
      }
    }

    return {
      url: site.url || '',
      ssl_url: site.ssl_url || undefined,
      name: site.name || siteName,
      deploy_id: deploy.id || '',
      admin_url: site.admin_url || ''
    };

  } catch (error) {
    console.error('Netlify deployment error:', error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        throw new Error('Invalid Netlify access token. Please check your token and try again.');
      } else if (error.message.includes('403') || error.message.includes('forbidden')) {
        throw new Error('Access denied. Please ensure your Netlify token has the required permissions.');
      } else if (error.message.includes('422') || error.message.includes('site name')) {
        throw new Error(`The Netlify site name "${siteName}.netlify.app" is already registered on Netlify under a different account/team. Please connect the Netlify token that owns this site, or choose a different site name.`);
      }
    }

    throw new Error(error instanceof Error ? error.message : 'Failed to deploy to Netlify');
  }
}

export async function validateNetlifyToken(accessToken: string): Promise<boolean> {
  try {
    const netlify = new NetlifyAPI(accessToken);
    await netlify.getCurrentUser();
    return true;
  } catch (error) {
    return false;
  }
}

export async function getSiteByName(accessToken: string, siteName: string): Promise<any> {
  try {
    const netlify = new NetlifyAPI(accessToken);
    // 1. Try direct domain get lookup
    try {
      const site = await netlify.getSite({ siteId: `${siteName}.netlify.app` });
      if (site) return site;
    } catch (err) {
      console.warn(`[getSiteByName] Direct getSite by domain name failed, falling back:`, err);
    }
    // 2. Fallback to listSites
    const sites = await netlify.listSites({ filter: 'all', per_page: 100 });
    return sites.find((site: any) => site.name === siteName);
  } catch (error) {
    console.error('Error getting site by name:', error);
    return null;
  }
}
