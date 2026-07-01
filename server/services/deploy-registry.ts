import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import * as ftp from "basic-ftp";

const execAsync = promisify(exec);

function parseSecretKey(secretKey: string): any {
  try {
    return JSON.parse(secretKey);
  } catch {
    return { bucket: secretKey };
  }
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".xml": "application/xml; charset=utf-8",
    ".json": "application/json; charset=utf-8",
  };
  return map[ext] || "application/octet-stream";
}

async function uploadDirToS3(s3Client: S3Client, bucketName: string, localDir: string) {
  const walk = async (dir: string): Promise<string[]> => {
    let files: string[] = [];
    const list = await fs.promises.readdir(dir);
    for (const file of list) {
      const filePath = path.join(dir, file);
      const stat = await fs.promises.stat(filePath);
      if (stat && stat.isDirectory()) {
        files = files.concat(await walk(filePath));
      } else {
        files.push(filePath);
      }
    }
    return files;
  };

  const allFiles = await walk(localDir);
  for (const filePath of allFiles) {
    const relativePath = path.relative(localDir, filePath).replace(/\\/g, '/');
    const mimeType = getMimeType(filePath);
    const fileStream = fs.createReadStream(filePath);

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: relativePath,
        Body: fileStream,
        ContentType: mimeType,
      })
    );
  }
}

export interface DeployResult {
  url: string;
  projectId?: string;
  details?: string;
}

export interface ProviderHandler {
  validate: (credentials: Record<string, string>) => Promise<boolean>;
  deploy: (
    tempDir: string,
    credentials: Record<string, string>,
    options: { projectName: string; [key: string]: any }
  ) => Promise<DeployResult>;
}

export const deployRegistry: Record<string, ProviderHandler> = {
  vercel: {
    validate: async (credentials) => {
      const token = credentials.apiKey || credentials.vercelToken;
      if (!token) return false;
      try {
        const checkRes = await fetch("https://api.vercel.com/v2/user", {
          headers: { Authorization: `Bearer ${token}` }
        });
        return checkRes.ok;
      } catch {
        return false;
      }
    },
    deploy: async (tempDir, credentials, options) => {
      const token = credentials.apiKey || credentials.vercelToken;
      const name = options.projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
      
      if (!token) throw new Error("Vercel API Token is required");

      console.log(`[deploy-registry] Deploying to Vercel: ${name}`);

      // Set environment variables for non-interactive deploy
      const env = {
        ...process.env,
        VERCEL_TOKEN: token,
        VERCEL_ORG_ID: credentials.accessKey || credentials.vercelOrgId || "", // Optional org ID
        VERCEL_PROJECT_ID: credentials.secretKey || credentials.vercelProjectId || "" // Optional project ID
      };

      // Run Vercel CLI deploy
      const cmd = `npx.cmd vercel deploy "${tempDir}" --name="${name}" --prod --yes --token="${token}"`;
      const { stdout, stderr } = await execAsync(cmd, { env });
      
      console.log(`[deploy-registry] Vercel stdout:`, stdout);
      if (stderr) console.warn(`[deploy-registry] Vercel stderr:`, stderr);

      // Extract Vercel URL from stdout (usually matches https://xxxx.vercel.app)
      const urlMatch = stdout.match(/https:\/\/[a-z0-9-]+\.vercel\.app/i);
      const url = urlMatch ? urlMatch[0] : `https://${name}.vercel.app`;

      return { url, projectId: name, details: stdout };
    }
  },

  firebase: {
    validate: async (credentials) => {
      const token = credentials.apiKey || credentials.firebaseToken;
      if (!token) return false;
      try {
        await execAsync(`npx.cmd firebase-tools projects:list --token="${token}"`);
        return true;
      } catch {
        return false;
      }
    },
    deploy: async (tempDir, credentials, options) => {
      const token = credentials.apiKey || credentials.firebaseToken;
      const projectId = credentials.accessKey || credentials.firebaseProjectId || options.projectName;

      if (!token) throw new Error("Firebase Token is required");
      if (!projectId) throw new Error("Firebase Project ID is required");

      console.log(`[deploy-registry] Deploying to Firebase: ${projectId}`);

      // Write firebase.json config file into the temporary directory
      const firebaseConfig = {
        hosting: {
          public: ".",
          ignore: ["firebase.json", "**/.*", "**/node_modules/**"]
        }
      };
      await fs.promises.writeFile(
        path.join(tempDir, "firebase.json"),
        JSON.stringify(firebaseConfig, null, 2),
        "utf8"
      );

      // Run Firebase deploy command
      const cmd = `npx.cmd firebase-tools deploy --token="${token}" --project="${projectId}" --only hosting`;
      const { stdout, stderr } = await execAsync(cmd, { cwd: tempDir });

      console.log(`[deploy-registry] Firebase stdout:`, stdout);
      if (stderr) console.warn(`[deploy-registry] Firebase stderr:`, stderr);

      // Get project hosting URL
      const url = `https://${projectId}.web.app`;

      return { url, projectId, details: stdout };
    }
  },

  surge: {
    validate: async (credentials) => {
      const token = credentials.apiKey || credentials.surgeToken;
      if (!token) return false;
      try {
        const { stdout } = await execAsync(`npx.cmd surge whoami --token="${token}"`);
        return !stdout.includes("Not Authed");
      } catch {
        return false;
      }
    },
    deploy: async (tempDir, credentials, options) => {
      const token = credentials.apiKey || credentials.surgeToken;
      let domain = credentials.accessKey || credentials.surgeDomain || `${options.projectName}.surge.sh`;
      
      if (!token) throw new Error("Surge Token is required");
      if (!domain.endsWith(".surge.sh")) {
        domain = `${domain.split(".")[0]}.surge.sh`;
      }

      console.log(`[deploy-registry] Deploying to Surge: ${domain}`);

      // Run Surge deployment command
      const cmd = `npx.cmd surge "${tempDir}" "${domain}" --token="${token}"`;
      const { stdout, stderr } = await execAsync(cmd);

      console.log(`[deploy-registry] Surge stdout:`, stdout);
      if (stderr) console.warn(`[deploy-registry] Surge stderr:`, stderr);

      const url = `https://${domain}`;

      return { url, projectId: domain, details: stdout };
    }
  },

  "aws-s3": {
    validate: async (credentials) => {
      try {
        const { bucket, region } = parseSecretKey(credentials.secretKey || "");
        if (!bucket) return false;
        const client = new S3Client({
          region: region || "us-east-1",
          credentials: {
            accessKeyId: credentials.accessKey || "",
            secretAccessKey: credentials.apiKey || ""
          }
        });
        await client.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 }));
        return true;
      } catch (e) {
        console.error("[deploy-registry] AWS S3 validation failed:", e);
        return false;
      }
    },
    deploy: async (tempDir, credentials, options) => {
      const { bucket, region, customDomain } = parseSecretKey(credentials.secretKey || "");
      if (!bucket) throw new Error("S3 Bucket name is required");
      
      const regionName = region || "us-east-1";
      console.log(`[deploy-registry] Deploying to AWS S3 bucket: ${bucket} in region ${regionName}`);
      
      const s3Client = new S3Client({
        region: regionName,
        credentials: {
          accessKeyId: credentials.accessKey || "",
          secretAccessKey: credentials.apiKey || ""
        }
      });

      await uploadDirToS3(s3Client, bucket, tempDir);
      
      const url = customDomain 
        ? (customDomain.startsWith("http") ? customDomain : `https://${customDomain}`)
        : `http://${bucket}.s3-website-${regionName}.amazonaws.com`;

      return { url, projectId: bucket, details: `Successfully uploaded all files to AWS S3 bucket: ${bucket}` };
    }
  },

  gcs: {
    validate: async (credentials) => {
      try {
        const { bucket } = parseSecretKey(credentials.secretKey || "");
        if (!bucket) return false;
        const client = new S3Client({
          endpoint: "https://storage.googleapis.com",
          region: "auto",
          credentials: {
            accessKeyId: credentials.accessKey || "",
            secretAccessKey: credentials.apiKey || ""
          }
        });
        await client.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 }));
        return true;
      } catch (e) {
        console.error("[deploy-registry] GCS validation failed:", e);
        return false;
      }
    },
    deploy: async (tempDir, credentials, options) => {
      const { bucket, customDomain } = parseSecretKey(credentials.secretKey || "");
      if (!bucket) throw new Error("GCS Bucket name is required");
      
      console.log(`[deploy-registry] Deploying to Google Cloud Storage bucket: ${bucket}`);
      
      const s3Client = new S3Client({
        endpoint: "https://storage.googleapis.com",
        region: "auto",
        credentials: {
          accessKeyId: credentials.accessKey || "",
          secretAccessKey: credentials.apiKey || ""
        }
      });

      await uploadDirToS3(s3Client, bucket, tempDir);
      
      const url = customDomain 
        ? (customDomain.startsWith("http") ? customDomain : `https://${customDomain}`)
        : `https://storage.googleapis.com/${bucket}/index.html`;

      return { url, projectId: bucket, details: `Successfully uploaded all files to GCS bucket: ${bucket}` };
    }
  },

  b2: {
    validate: async (credentials) => {
      try {
        const { bucket, endpoint } = parseSecretKey(credentials.secretKey || "");
        if (!bucket || !endpoint) return false;
        const cleanEndpoint = endpoint.startsWith("http") ? endpoint : `https://${endpoint}`;
        const client = new S3Client({
          endpoint: cleanEndpoint,
          region: "auto",
          credentials: {
            accessKeyId: credentials.accessKey || "",
            secretAccessKey: credentials.apiKey || ""
          }
        });
        await client.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 }));
        return true;
      } catch (e) {
        console.error("[deploy-registry] Backblaze B2 validation failed:", e);
        return false;
      }
    },
    deploy: async (tempDir, credentials, options) => {
      const { bucket, endpoint, customDomain } = parseSecretKey(credentials.secretKey || "");
      if (!bucket) throw new Error("B2 Bucket name is required");
      if (!endpoint) throw new Error("B2 S3 endpoint is required");
      
      const cleanEndpoint = endpoint.startsWith("http") ? endpoint : `https://${endpoint}`;
      console.log(`[deploy-registry] Deploying to Backblaze B2 bucket: ${bucket} via ${cleanEndpoint}`);
      
      const s3Client = new S3Client({
        endpoint: cleanEndpoint,
        region: "auto",
        credentials: {
          accessKeyId: credentials.accessKey || "",
          secretAccessKey: credentials.apiKey || ""
        }
      });

      await uploadDirToS3(s3Client, bucket, tempDir);
      
      const url = customDomain 
        ? (customDomain.startsWith("http") ? customDomain : `https://${customDomain}`)
        : `https://${bucket}.${endpoint.replace(/^s3\./i, '')}/index.html`;

      return { url, projectId: bucket, details: `Successfully uploaded all files to Backblaze B2 bucket: ${bucket}` };
    }
  },

  "github-pages": {
    validate: async (credentials) => {
      const token = credentials.apiKey;
      if (!token) return false;
      try {
        const res = await fetch("https://api.github.com/user", {
          headers: { 
            "Authorization": `token ${token}`,
            "User-Agent": "SiteGenie-Deployer"
          }
        });
        return res.ok;
      } catch {
        return false;
      }
    },
    deploy: async (tempDir, credentials, options) => {
      const token = credentials.apiKey;
      const owner = credentials.accessKey;
      const { repo, branch, customDomain } = parseSecretKey(credentials.secretKey || "");
      if (!token) throw new Error("GitHub PAT is required");
      if (!owner || !repo) throw new Error("GitHub repository owner and name are required");
      
      const targetBranch = branch || "gh-pages";
      const repoUrl = `https://${token}@github.com/${owner}/${repo}.git`;
      
      console.log(`[deploy-registry] Deploying to GitHub Pages: ${owner}/${repo} (${targetBranch})`);
      
      try {
        await execAsync(`git init`, { cwd: tempDir });
        await execAsync(`git config user.name "SiteGenie Deployer"`, { cwd: tempDir });
        await execAsync(`git config user.email "deployer@sitegenie.app"`, { cwd: tempDir });
        await execAsync(`git checkout -b ${targetBranch}`, { cwd: tempDir });
        await execAsync(`git add .`, { cwd: tempDir });
        await execAsync(`git commit -m "Deploy website to GitHub Pages - ${new Date().toISOString()}"`, { cwd: tempDir });
        await execAsync(`git push --force "${repoUrl}" ${targetBranch}`, { cwd: tempDir });
      } catch (err: any) {
        console.error("Git execution failed:", err);
        throw new Error(`Git deployment failed: ${err.message || String(err)}`);
      }
      
      const url = customDomain 
        ? (customDomain.startsWith("http") ? customDomain : `https://${customDomain}`)
        : `https://${owner.toLowerCase()}.github.io/${repo.toLowerCase()}/`;
         
      return { url, projectId: `${owner}/${repo}`, details: `Successfully pushed to repository: ${owner}/${repo} branch: ${targetBranch}` };
    }
  },

  ftp: {
    validate: async (credentials) => {
      const { host, port, user, secure } = parseSecretKey(credentials.secretKey || "");
      const client = new ftp.Client();
      try {
        client.ftp.verbose = false;
        await client.access({
          host: host || credentials.accessKey,
          port: port ? parseInt(port) : 21,
          user: user || credentials.accessKey,
          password: credentials.apiKey,
          secure: secure === "true" || secure === true
        });
        await client.list();
        client.close();
        return true;
      } catch (e) {
        console.error("[deploy-registry] FTP validation failed:", e);
        client.close();
        return false;
      }
    },
    deploy: async (tempDir, credentials, options) => {
      const { host, port, user, remoteDir, secure, customDomain } = parseSecretKey(credentials.secretKey || "");
      const ftpHost = host || credentials.accessKey;
      const ftpUser = user || credentials.accessKey;
      if (!ftpHost) throw new Error("FTP Host is required");
      if (!ftpUser) throw new Error("FTP User is required");
      
      console.log(`[deploy-registry] Deploying via FTP to ${ftpHost}`);
      const client = new ftp.Client();
      try {
        client.ftp.verbose = true;
        await client.access({
          host: ftpHost,
          port: port ? parseInt(port) : 21,
          user: ftpUser,
          password: credentials.apiKey,
          secure: secure === "true" || secure === true
        });
        
        const targetDir = remoteDir || "/";
        await client.ensureDir(targetDir);
        await client.clearWorkingDir();
        await client.uploadFromDir(tempDir);
        
        client.close();
        
        const url = customDomain 
          ? (customDomain.startsWith("http") ? customDomain : `https://${customDomain}`)
          : `http://${ftpHost}`;
           
        return { url, projectId: ftpHost, details: `Successfully uploaded all files via FTP to: ${ftpHost}${targetDir}` };
      } catch (e: any) {
        client.close();
        throw e;
      }
    }
  }
};
