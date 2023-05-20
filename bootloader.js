const ExtensionUtils = imports.misc.extensionUtils;
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
    const settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.customreboot');
    if (await efibootmgr.IsUseable() && settings.get_boolean('use-efibootmgr')) return BootLoaders.EFI;
    if (await grub.IsUseable() && settings.get_boolean('use-grub')) return BootLoaders.GRUB;
    if (await systemdBoot.IsUseable() && settings.get_boolean('use-systemd-boot')) return BootLoaders.SYSD;
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