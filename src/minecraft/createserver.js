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
