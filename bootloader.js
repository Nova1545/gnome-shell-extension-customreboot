const Me = imports.misc.extensionUtils.getCurrentExtension();
const grub = Me.imports.grub;
const systemdBoot = Me.imports.systemdBoot;
const efibootmgr = Me.imports.efibootmgr;
const Utils = Me.imports.utils;


const BootLoaders = {
    EFI: "EFI Boot Manager",
    GRUB: "Grub",
    SYSD: "Systemd Boot",
    UNKNOWN: "Unknown Boot Loader"
}


/**
 * Gets the first available boot loader type on the current system
 * @returns BootLoaders type. Can be "EFI", "SYSD", "GRUB", or "UNKNOWN"
 */
async function GetUseableType() {
    if (await efibootmgr.IsUseable()) return BootLoaders.EFI;
    if (await systemdBoot.IsUseable()) return BootLoaders.SYSD;
    if (await grub.IsUseable()) return BootLoaders.GRUB;
    return BootLoaders.UNKNOWN;
}

/**
 * Gets a instance of the provided boot loader
 * @returns A boot loader if one is found otherwise undefined
 */
async function GetUseable(type) {
    if (type === BootLoaders.EFI) return efibootmgr;
    if (type === BootLoaders.SYSD) return systemdBoot;
    if (type === BootLoaders.GRUB) return grub;
    return undefined;
}