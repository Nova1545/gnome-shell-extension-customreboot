const Me = imports.misc.extensionUtils.getCurrentExtension();
const Utils = Me.imports.utils;
const Gio = imports.gi.Gio;

/**
 * Get's all available boot options
 * @returns {[Map, string]} Map(Title, id), defaultOption
 */
async function GetBootOptions() {
    const [status, stdout, stderr] = await Utils.execCommand(['efibootmgr'],);
    const lines = stdout.split("\n");

    let boot_first = "0000";

    const boot_options = new Map();

    for (let l = 0; l < lines.length; l++) {
        const line = lines[l];
        if (line.startsWith("BootOrder:")) {
            boot_first = line.split(" ")[1].split(",")[0];
            continue;
        }

        const regex = /(Boot[0-9]{4})/;
        const vLine = regex.exec(line)
        if (vLine && vLine.length) {
            const option = line.replace("Boot", "").split("*");
            const title = option[1];
            if (title.includes("HD") || title.includes("RC")) {
                const trimed_title = title.replace(/(?<=[\S\s]*)(HD|RC)([\s\S()]*|$)/, "").trim();
                boot_options.set(trimed_title, option[0].trim());
            }
            else {
                boot_options.set(option[1].trim(), option[0].trim());
            }
        }
    }

    return [boot_options, boot_first];
}

/**
 * Set's the next boot option
 * @param {string} id 
 * @returns True if the boot option was set, otherwise false
 */
async function SetBootOption(id) {
    const [status, stdout, stderr] = await Utils.execCommand(['/usr/bin/pkexec', 'efibootmgr', '-n', id],);
    if (status === 0) {
        Utils._log(`Set boot option to ${id}`);
        return true;
    }
    Utils._logWarning("Unable to set boot option using efibootmgr");
    return false;
}

/**
 * Can we use this bootloader?
 * @returns True if usable otherwise false
 */
async function IsUseable() {
    try {
        let [status, stdout, stderr] = await Utils.execCommand(['efibootmgr'],);
        return status === 0;
    } catch (e) {
        return false;
    }
}

/**
 * This boot loader cannot be quick rebooted
 */
async function CanQuickReboot() {
    return false;
}

/**
 * 
 */
async function QuickRebootEnabled() {
    return false;
}