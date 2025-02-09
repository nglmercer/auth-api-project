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
import fs from "fs";
import { TASK_MANAGER, addDownloadTask, unpackArchive } from "../modules/taskmanager.js";
import { logger } from "../utils/utils.js";
export async function prepareJavaForServer(javaVersion) {
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
const mockJavaManager = {
    getJavaPath: (version) => version === "17" ? "/usr/local/java/bin/java" : false,
    getJavaInfoByVersion: (version) => ({
        url: "https://example.com/java.zip",
        downloadPath: `/tmp/java-${version}.zip`,
        unpackPath: `/opt/java-${version}`
    })
};

const mockDownloadsManager = {
    addDownloadTask: (url, path, cb) => cb(true),
    unpackArchive: (path, dest, cb) => cb(true)
};

// Sobreescribir objetos globales con los mocks
global.JAVA_MANAGER = mockJavaManager;
global.DOWNLOADS_MANAGER = mockDownloadsManager;

// Test 1: Si se pasa una ruta válida, debe retornarla sin cambios
prepareJavaForServer("/usr/bin/java", (result) => {
    assert.strictEqual(result, "/usr/bin/java");
    console.log("✅ Test 1: Ruta válida pasa correctamente.");
});

// Test 2: Si Java ya está instalado, debe devolver la ruta existente
prepareJavaForServer("17", (result) => {
    assert.strictEqual(result, "/usr/local/java/bin/java");
    console.log("✅ Test 2: Java ya instalado devuelve la ruta correcta.");
});

// Test 3: Si Java no está instalado, debe descargarlo y devolver una ruta
prepareJavaForServer("18", (result) => {
    assert.strictEqual(typeof result, "string");
    console.log("✅ Test 3: Java no instalado se descarga correctamente.");
});

// Test 4: Si la descarga falla, debe devolver `false`
mockDownloadsManager.addDownloadTask = (url, path, cb) => cb(false);
prepareJavaForServer("19", (result) => {
    assert.strictEqual(result, false);
    console.log("✅ Test 4: Falla la descarga y devuelve false.");
});