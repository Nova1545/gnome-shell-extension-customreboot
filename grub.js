/* grub.js
 *
 * Copyright (C) 2020
 *      Daniel Shchur (DocQuantum) <shchurgood@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Utils = Me.imports.utils;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const ByteArray = imports.byteArray;


/**
 * getBootOptions:
 * @returns {[Map, String]} Map(title, title), defaultOption
 * 
 * Parses the grub config to get the currently configured
 * menuentries.
 * defaultOption is set to the first menuentry
 */
async function getBootOptions() {
    try {
        let cfgpath = Utils.getGrubConfig();
        if (cfgpath == "") {
            throw new String("Failed to find grub config");
        }

        let bootOptions = new Map();

        let defualtEn = "";

        let file = Gio.file_new_for_path(cfgpath);
        let [suc, content] = file.load_contents(null);
        if (!suc) {
            throw new String("Failed to load grub config");
        }

        let lines;
        if (content instanceof Uint8Array) {
            lines = ByteArray.toString(content);
        }
        else {
            lines = content.toString();
        }

        let entryRx = /^menuentry ['"]([^'"]+)/;
        let defaultRx = /(?<=set default=\")([A-Za-z- ()/0-9]*)(?=\")/
        lines.split('\n').forEach(l => {
            let res = entryRx.exec(l);
            if (res && res.length) {
                bootOptions.set(res[1], res[1]);
            }
            let def = defaultRx.exec(l);
            if (def && def.length) {
                defualtEn = def[0];
            }
        });

        bootOptions.forEach((v, k) => {
            Utils._log(`${k} = ${v}`);
        });

        if (defualtEn == "") defualtEn = bootOptions.keys().next().value;

        return [bootOptions, defualtEn];
            
    } catch (e) {
        Utils._logWarning(e);
        return undefined;
    }
}

/**
 * setBootOption:
 * 
 * @param {string} title
 * @returns {bool} whether it was able to set it or not
 * 
 * The menuentry title to be passed to grub-reboot so that that
 * boot option is set to be the one to boot off of next boot. 
 */
 async function setBootOption(title) {
    try {
        let [status, stdout, stderr] = await Utils.execCommand(
            ['/usr/bin/pkexec', '/usr/sbin/grub-reboot', title],
        );
        if (status !== 0)
            throw new String(`Failed to set boot option to ${title}:\nExitCode: ${status}\nstdout: ${stdout}\nstderr: ${stderr}`);
        Utils._log(`Set boot option to ${title}: ${status}\n${stdout}\n${stderr}`);
        return true;
    } catch (e) {
        Utils._logWarning(e);
        return false;
    }
}

/**
 * setReadable;
 * 
 * Attempts to make the grub.conf file readable by everyone
 */
async function setReadable() {
    try {
        const config = Utils.getGrubConfig();
        let [status, stdout, stderr] = await Utils.execCommand(['/usr/bin/pkexec', '/usr/bin/chmod', '644', config],);
        if (status !== 0) {
            Utils._logWarning(`Failed to make ${config} readable`);
            return false;
        }
        Utils._log(`Made ${config} readable`);
        return true;
    }
    catch (e) {
        Utils._logWarning(e);
        return false;
    }
}

/**
 * enableQuickReboot
 * 
 * Copies a custom grub script to allow the extension to quickly reboot into another OS
 * If anyone reads this: Idk how to combine these into one pkexec call, if you do please leave a commit fixing it
 */
async function enableQuickReboot() {
    try {
        let [status, stdout, stderr] = await Utils.execCommand([
            'pkexec',
            'sh',
            '-c',
            `/usr/bin/cp ${Me.path}/42_custom_reboot /etc/grub.d/42_custom_reboot && /usr/bin/chmod 755 /etc/grub.d/42_custom_reboot && /usr/sbin/update-grub`
          ]);

        if (status !== 0) {
            return false;
        }

        return true;
    }
    catch (e) {
        Utils._logWarning(e);
        return false;
    }
}

/**
 * disableQuickReboot
 * 
 * Removes the script used to allow the extension to quickly reboot into another OS without waiting for grub's timeout
 * If anyone reads this: Idk how to combine these into one pkexec call, if you do please leave a commit fixing it
 */
async function disableQuickReboot() {
    try {

        let [status, stdout, stderr] = await Utils.execCommand([
            'pkexec',
            'sh',
            '-c',
            '/usr/bin/rm /etc/grub.d/42_custom_reboot && /usr/sbin/update-grub'
          ]);

        if (status !== 0) {
            return false;
        }

        return true;
    }
    catch (e) {
        Utils._logWarning(e);
        return false;
    }
}

/**
 * IsQuickRebootable
 * 
 * Checks if /etc/grub.d/42_custom_reboot exists
 */
async function isQuickRebootable() {
    try {
        let [status, stdout, stderr] = await Utils.execCommand(['/usr/bin/cat', '/etc/grub.d/42_custom_reboot'],);
        if (status !== 0) {
            Utils._logWarning(`/etc/grub.d/42_custom_reboot not found`);
            return false;
        }
        Utils._log(`/etc/grub.d/42_custom_reboot found`);

        return true;
    }
    catch (e) {
        Utils._logWarning(e);
        return false;
    }
}