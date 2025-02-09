import axios from "axios";
import path from "path";
import * as cheerio from 'cheerio';
import { readCoresFile, writeCoresFile, isDataRecent, fetchData, logger } from '../utils/utils.js';
import CORES_URL_GEN from "./coresURLGenerator.js";

const URL = 'https://getbukkit.org/download/spigot';
const manifestUrl = 'https://piston-meta.mojang.com/mc/game/version_manifest.json';
const coresFilePath = path.join(process.cwd(), 'cores.json');

const PREDEFINED = {
    SERVER_CORES: {
        vanilla: { name: "vanilla", displayName: "Vanilla", versionsMethod: "vanilla", urlGetMethod: "vanilla" },
        paper: { name: "paper", displayName: "PaperMC", versionsMethod: "paper", urlGetMethod: "paper" },
        waterfall: { name: "waterfall", displayName: "Waterfall (Proxy)", versionsMethod: "paper", urlGetMethod: "paper" },
        velocity: { name: "velocity", displayName: "Velocity (Proxy)", versionsMethod: "paper", urlGetMethod: "paper" },
        purpur: { name: "purpur", displayName: "PurpurMC", versionsMethod: "purpur", urlGetMethod: "purpur" },
        spigot: { name: "spigot", displayName: "Spigot", versionsMethod: "spigot", urlGetMethod: "spigot" }
    }
};

export const getSpigotVersions = async () => {
        try {
            const { data } = await axios.get(URL);
            const $ = cheerio.load(data);
            const versions = [];
            
            $('.download-pane').each((_, element) => {
                const version = $(element).find('div.col-sm-3 h2').text().trim();
                const size = $(element).find('div.col-sm-2 h3').text().trim();
                const releaseDate = $(element).find('div.col-sm-3:nth-of-type(2) h3').text().trim();
                const downloadLink = $(element).find('a.btn-download').attr('href');
                
                if (version && downloadLink) {
                    versions.push({ version, size, releaseDate, downloadLink });
                }
            });
    
            console.log(JSON.stringify(versions, null, 2));
            return JSON.parse(JSON.stringify(versions, null, 2));
        } catch (error) {
            console.error('Error obteniendo las versiones:', error);
        }
};

export const getAllMinecraftVersions = async () => {
    const manifest = await fetchData(manifestUrl);
    const versions = {};

    await Promise.all(manifest.versions.map(async (version) => {
        try {
            const versionInfo = await fetchData(version.url);
            if (versionInfo.downloads && versionInfo.downloads.server) {
                versions[version.id] = versionInfo.downloads.server.url;
            }
        } catch (error) {
            logger.error(`Error fetching version details for ${version.id}:`, error.message);
        }
    }));
    console.log(JSON.stringify(versions, null, 2));
    return versions;
};

export const getvanillacore = async (cb = (data) => { console.log(data); }) => {
    let cachedData = readCoresFile(coresFilePath);

    if (cachedData && isDataRecent(cachedData)) {
        logger.log('Usando datos cacheados');
        const sortedCachedData = Object.keys(cachedData.versions)
            .filter(version => version.length <= 7)
            .sort((a, b) => a.length - b.length || a.localeCompare(b));
        cb(sortedCachedData);
        return;
    }

    logger.log('Obteniendo datos de la red');
    const allVersions = await getAllMinecraftVersions();
    const sortedAllVersions = Object.keys(allVersions)
        .filter(version => version.length <= 7)
        .sort((a, b) => a.length - b.length || a.localeCompare(b));

    const newData = {
        lastUpdated: new Date().toISOString(),
        versions: allVersions
    };
    writeCoresFile(coresFilePath, newData);
    cb(sortedAllVersions);
};

export const getCoreVersions = async (core, cb) => {
    const coreItem = PREDEFINED.SERVER_CORES[core];
    if (!coreItem) {
        cb(false);
        return;
    }

    const name = coreItem.name || coreItem.versionsMethod;
    switch (coreItem.versionsMethod) {
        case "vanilla":
            await getvanillacore(cb);
            break;
        case "externalURL":
            CORES_URL_GEN.getAllCoresByExternalURL(coreItem.versionsUrl, cb, name);
            break;
        case "paper":
            CORES_URL_GEN.getAllPaperLikeCores(cb, coreItem.name, name);
            break;
        case "purpur":
            CORES_URL_GEN.getAllPurpurCores(cb, name);
            break;
        case "magma":
            CORES_URL_GEN.getAllMagmaCores(cb, name);
            break;
        case "spigot":
            const versions = await getSpigotVersions();
            cb(versions);
            break;
        default:
            cb(false);
            break;
    }
};

export const getCoreVersionURL = async (core, version, cb) => {
    const coreItem = PREDEFINED.SERVER_CORES[core];
    if (!coreItem || !version) {
        cb(false);
        return;
    }

    switch (coreItem.urlGetMethod) {
        case "vanilla":
            const allVersions = await getAllMinecraftVersions();
            cb(allVersions[version]);
            break;
        case "externalURL":
            CORES_URL_GEN.getCoreByExternalURL(coreItem.versionsUrl, version, cb);
            break;
        case "paper":
            CORES_URL_GEN.getPaperCoreURL(coreItem.name, version, cb);
            break;
        case "purpur":
            CORES_URL_GEN.getPurpurCoreURL(version, cb);
            break;
        case "magma":
            CORES_URL_GEN.getMagmaCoreURL(version, cb);
            break;
        default:
            cb(false);
            break;
    }
};

export const getCoresList = () => PREDEFINED.SERVER_CORES;
console.log(getCoresList());
//console.log(getCoreVersions("spigot",(data)=>{console.log(data)}));
//console.log(getCoreVersionURL("spigot", "1.21",(data)=>{console.log(data)}));
//console.log(getAllMinecraftVersions());
console.log(getvanillacore());
//console.log(getSpigotVersions());
export default {
    getSpigotVersions,
    getAllMinecraftVersions,
    getvanillacore,
    getCoreVersions,
    getCoreVersionURL,
    getCoresList
};