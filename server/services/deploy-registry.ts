import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

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
  }
};
