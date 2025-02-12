import {
    gameVersionToJava,
    isTermux,
    getArchitecture,
    installJavaTermux,
    checkJavaVersionTermux,
    getDownloadableJavaVersions,
    getLocalJavaVersions,
    getJavaInfoByVersion,
    getJavaPath,
    verifyJavaInstallation
} from "./javaManager.js";
import {
    getSpigotVersions,
    getVanillaCore,
    getCoreVersions,
    getCoreVersionURL,
    getCoresList
} from "./coredownloader.js";
import fs from "fs";
import path from "path";
import axios from "axios";
import { TASK_MANAGER, addDownloadTask, unpackArchive } from "../modules/taskmanager.js";
import FileManager from "../modules/FileManager.js";
const PREDEFINED = {
    SERVER_STATUSES: {
      STOPPED: "stopped",
      RUNNING: "running",
      STARTING: "starting",
      STOPPING: "stopping"
    },
    TASKS_TYPES: {
      DOWNLOADING: "downloading",
      INSTALLING: "installing",
      ZIPPING: "zipping",
      UNPACKING: "unpacking",
      UPDATING: "updating",
      RESTARTING: "restarting",
      CREATING: "creating",
      DELETION: "deletion",
      COMMON: "common",
      UNKNOWN: "unknown"
    },
    SERVER_CREATION_STEPS: {
      SEARCHING_CORE: "searchingCore",
      CHECKING_JAVA: "checkingJava",
      DOWNLOADING_JAVA: "downloadingJava",
      UNPACKING_JAVA: "unpackingJava",
      DOWNLOADING_CORE: "downloadingCore",
      CREATING_BAT: "creatingBat",
      COMPLETION: "completion",
      COMPLETED: "completed",
      FAILED: "failed"
    }
  };
import { logger } from "../utils/utils.js";
export async function prepareJavaForServer(javaVersion) {
    if (typeof javaVersion !== 'string') javaVersion = String(javaVersion ?? '');
    try {
        let javaExecutablePath = "";
        let javaDownloadURL = "";
        let isJavaNaN = isNaN(parseInt(javaVersion));

        if (isJavaNaN && fs.existsSync(javaVersion)) {
            return javaVersion;
        }

        if (!isJavaNaN) {
            javaExecutablePath = getJavaPath(javaVersion);
            if (!javaExecutablePath) {
                let javaVerInfo = getJavaInfoByVersion(javaVersion);
                javaDownloadURL = javaVerInfo.url;
                console.log(javaDownloadURL, javaVerInfo);

                const javaDlResult = await addDownloadTask(javaDownloadURL, javaVerInfo.downloadPath);
                if (!javaDlResult) {
                    logger.warning( "{{console.javaDownloadFailed}");
                    return false;
                }

                const javaUnpackResult = await unpackArchive(javaVerInfo.downloadPath, javaVerInfo.unpackPath, true);
                if (!javaUnpackResult) {
                    logger.warning( "{{console.javaUnpackFailed}}");
                    return false;
                }

                javaExecutablePath = getJavaPath(javaVersion);
            }
            return javaExecutablePath;
        }
        return javaExecutablePath;
    } catch (error) {
        console.error("Error in prepareJavaForServer:", error);
        return false;
    }
}
export const getPlatformInfo = () => {
    const isTermux = process.platform === "android" || fs.existsSync("/data/data/com.termux");
    const isWindows = process.platform === "win32";
    const isLinux = process.platform === "linux";
    return {
      isTermux,
      isWindows,
      isLinux,
      startScript: isWindows ? "start.bat" : "start.sh",
      platform: process.platform,
    };
  };

export class ServerManager {
    constructor(basePath = "./servers") {
        this.fileManager = new FileManager(basePath);
    }

    writeStartFiles(config) {
        let { serverName, coreFileName, startParameters = "-Xms1G -Xmx2G", javaExecutablePath, serverPort } = config;
        try {
            if (!serverName || !coreFileName || !javaExecutablePath || !serverPort) {
                throw new Error("Parámetros inválidos: asegúrate de proporcionar todos los valores requeridos.");
            }

            const platformInfo = getPlatformInfo();
            const fullStartParameters = `${startParameters ? startParameters + " " : ""} -jar "${coreFileName}" nogui`;
            const fullJavaExecutablePath = javaExecutablePath.startsWith(".") || javaExecutablePath.startsWith("/")
                ? `"${javaExecutablePath}/bin/java"`  // En Termux/Linux, Java suele estar en una subcarpeta
                : `"${path.resolve(javaExecutablePath, "java.exe")}"`; // En Windows, apunta a java.exe        

            const serverDir = serverName;
            this.fileManager.createFile(serverDir, "eula.txt", "eula=true");

            // Definir scripts según la plataforma
            const startScripts = {
                termux: `#!/data/data/com.termux/files/usr/bin/bash
cd "$(dirname "$0")"
export LD_LIBRARY_PATH=/data/data/com.termux/files/usr/lib
"${fullJavaExecutablePath}" ${fullStartParameters}`,

                windows: `@echo off
chcp 65001>nul
${this.getChangeDirectoryCommand(serverName)}
"${fullJavaExecutablePath}" ${fullStartParameters}`,

                linux: `#!/bin/bash
${this.getChangeDirectoryCommand(serverName)}
"${fullJavaExecutablePath}" ${fullStartParameters}`
            };

            console.log("[DEBUG] Start scripts:", startScripts);

            const scriptName = platformInfo.isWindows ? "start.bat" : "start.sh";
            this.fileManager.createFile(serverDir, scriptName, startScripts[platformInfo.isTermux ? "termux" : platformInfo.isWindows ? "windows" : "linux"]);

            this.fileManager.createFile(
                serverDir,
                "server.properties",
                `server-port=${serverPort}
query.port=${serverPort}
enable-query=true
online-mode=false
motd=\u00A7f${serverName}`
            );

            console.log(`✅ Archivos de inicio creados exitosamente para el servidor '${serverName}'.`);
            return true;

        } catch (error) {
            console.error("❌ Error al escribir archivos de inicio:", error.message);
            return false;
        }
    }

    getChangeDirectoryCommand(serverName) {
        const serverPath = path.join("servers", serverName);
        return `if not exist "${serverPath}" mkdir "${serverPath}"\ncd "${serverPath}"`;
    }
}
  const newServerManager = new ServerManager();
  export async function startJavaServerGeneration(params,cb) {
    let {serverName,core,coreVersion,startParameters,javaExecutablePath,serverPort } = params;
    console.log("[DEBUG] Starting server generation with params:", {
      serverName,
      core,
      coreVersion,
      startParameters,
      javaExecutablePath,
      serverPort,
    });
  
    if (!javaExecutablePath) {
      console.error("[ERROR] Invalid Java executable path");
      cb(false);
      return;
    }
  
    const coreFileName = `${core}-${coreVersion}.jar`;
    console.log("[DEBUG] Core filename:", coreFileName);
  
    const serverDirectoryPath = `./servers/${serverName}`;
    console.log("[DEBUG] Server directory path:", serverDirectoryPath);
    fs.mkdirSync(serverDirectoryPath, { recursive: true });
  
    console.log("[DEBUG] Attempting to download core...");
  
    try {
      const coreDownloadURL = await getCoreVersionURL(core, coreVersion);
      if (!coreDownloadURL) {
        console.error("[ERROR] Failed to retrieve download URL");
        cb(false);
        return;
      }
  
      console.log("[DEBUG] Core download URL:", coreDownloadURL);
  
      const coreFilePath = path.join(serverDirectoryPath, coreFileName);
      await downloadFile(coreDownloadURL, coreFilePath);
      newServerManager.writeStartFiles({serverName, coreFileName, startParameters, javaExecutablePath, serverPort});
  
      console.log(`✅ Core downloaded successfully: ${coreFilePath}`);
      cb(true);
    } catch (error) {
      console.error("[ERROR] Failed to download core:", error);
      cb(false);
    }
  }



async function downloadFile(url, outputPath) {
    const writer = fs.createWriteStream(outputPath);
    console.log(`[DEBUG] Descargando archivo desde ${url} a ${outputPath}`);

    try {
        const response = await axios.get(url, {
            responseType: "stream",
            headers: { "User-Agent": "Mozilla/5.0" }, // Evita bloqueos de servidores
        });

        return new Promise((resolve, reject) => {
            response.data.pipe(writer);
            writer.on("finish", () => {
                console.log(`[INFO] Descarga completada: ${outputPath}`);
                resolve();
            });
            writer.on("error", reject);
        });
    } catch (error) {
        console.error("[ERROR] Falló la descarga:", error.message);
    }
}

const configserver = {
  serverName: "MyMinecraftServer",  // Nombre del servidor
  core: "paper",              // Core (tipo de servidor)
  coreVersion: "1.21",             // Versión del core
  startParameters: "-Xms2G -Xmx4G",      // Parámetros de inicio
  javaExecutablePath: getJavaInfoByVersion(getLocalJavaVersions()[1]).javaBinPath,  // Ruta de ejecución de Java
  serverPort: 25565,                // Puerto del servidor
};
startJavaServerGeneration(

  configserver,
  (result) => {         // Callback de finalización
    if (result) {
      console.log("✅ Servidor creado exitosamente.");
    } else {
      console.log("❌ Error al crear el servidor.");
    }
  }
);


// install java prepareJavaForServer(17)
//prepareJavaForServer(21)
// get local java versions getLocalJavaVersions()
// get java info { }

// console.log(getLocalJavaVersions());
// console.log(getJavaInfoByVersion(getLocalJavaVersions()[0]));