import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as grub from "./grub.js";
import * as systemdBoot from "./systemdBoot.js";
import * as efibootmgr from "./efibootmgr.js";

import * as Utils from "./utils.js";
import GLib from 'gi://GLib';
import Gio from "gi://Gio";


export const BootLoaders = {
    EFI: "EFI Boot Manager",
    GRUB: "Grub",
    SYSD: "Systemd Boot",
    UNKNOWN: "Unknown Boot Loader"
}


/**
 * Gets the first available boot loader type on the current system
 * @returns BootLoaders type. Can be "EFI", "SYSD", "GRUB", or "UNKNOWN"
 */
export async function GetUseableType() {
    const settings = Extension.lookupByUUID("customreboot@nova1545").getSettings();
    if (await efibootmgr.IsUseable() && settings.get_boolean('use-efibootmgr')) return BootLoaders.EFI;
    if (await grub.IsUseable() && settings.get_boolean('use-grub')) return BootLoaders.GRUB;
    if (await systemdBoot.IsUseable() && settings.get_boolean('use-systemd-boot')) return BootLoaders.SYSD;
    return BootLoaders.UNKNOWN;
}

/**
 * Gets a instance of the provided boot loader
 * @returns A boot loader if one is found otherwise undefined
 */
export async function GetUseable(type) {
    if (type === BootLoaders.EFI) return efibootmgr;
    if (type === BootLoaders.SYSD) return systemdBoot;
    if (type === BootLoaders.GRUB) return grub;
    return undefined;
}