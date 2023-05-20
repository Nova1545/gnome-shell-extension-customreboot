/* utils.js
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

/* exports execCommand, getCurrentBootloader, getBootLoaderName,
            setDebug, _log, _logWarning */

const Me = imports.misc.extensionUtils.getCurrentExtension();
// const Prefs = Me.imports.prefs;

const SystemdBoot = Me.imports.systemdBoot;
const Grub = Me.imports.grub;
const Gio = imports.gi.Gio;

var DEBUG = false;

const BootLoaderType = {
    SYSTEMD_BOOT : 0,
    GRUB : 1
};

const BootLoaderClass = {
    0: SystemdBoot,
    1: Grub
};

/**
 * getBootctlPath
 * @returns {string}
 * 
 * Returns the path of the bootctl binary or an empty string if not found
 */
function getBootctlPath() {
    let paths = ["/usr/sbin/bootctl", "/usr/bin/bootctl"];

    let file;

    for (let i = 0; i < paths.length; i++) {
        file = Gio.file_new_for_path(paths[i]);
        if (file.query_exists(null)) {
            return paths[i];
        }
    }
    
    return "";    
}

/**
 * getGrubConfig
 * @returns {string}
 * 
 * Returns the path of the grub config or an empty string if not exist
 */
function getGrubConfig() {
    let paths = ["/boot/grub/grub.cfg", "/boot/grub2/grub.cfg"];

    let file;

    for (let i = 0; i < paths.length; i++) {
        file = Gio.file_new_for_path(paths[i]);
        if (file.query_exists(null)) {
            return paths[i];
        }
    }

    return "";
}

/**
 * getCurrentBootloader:
 * @returns {string}
 * 
 * Returns the current bootloader based on system configuration
 * and setting preferences.
 */
function getCurrentBootloader() {
    return BootLoaderClass[getCurrentBootloaderType()];
}

/**
 * getCurrentBootloaderType:
 * @returns {string}
 * 
 * Returns the current bootloader based on system configuration
 * and setting preferences.
 */
 function getCurrentBootloaderType() {
    // If there is a grub config, use grub-reboot, otherwise use systemdboot
    
    let grubcfg = getGrubConfig();

    if (grubcfg != "") {
        return BootLoaderType.GRUB;
    }

    return BootLoaderType.SYSTEMD_BOOT;
}

/**
 * getBootLoaderName:
 * @param {BootLoaderType} type
 * @returns {string}
 * 
 * Given a bootloader type, returns the name in string form.
 */
function getBootLoaderName(type) {
    return Object.keys(BootLoaderType)[type];
}

/**
 * execCommand:
 * 
 * @param {String[]} argv 
 * @param {String} input 
 * @param {Gio.Cancellable} cancellable
 * @returns {Promise} Function execution
 * => @returns {[int, String, String]} [StatusCode, STDOUT, STDERR]
 * 
 * Executes a command asynchronously.
 */
function execCommand(argv, input = null, cancellable = null) {
    let flags = Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE;

    if (input !== null)
        flags |= Gio.SubprocessFlags.STDIN_PIPE;

    let proc = new Gio.Subprocess({
        argv: argv,
        flags: flags
    });
    proc.init(cancellable);
    return new Promise((resolve,reject) => {
        proc.communicate_utf8_async(input, cancellable, (proc, res) => {
            try {
                resolve([(function() {
                    if(!proc.get_if_exited())
                        throw new Error("Subprocess failed to exit in time!");
                    return proc.get_exit_status()
                })()].concat(proc.communicate_utf8_finish(res).slice(1)));
            } catch (e) {
                reject(e);
            }
        });
    });
}

/**
 * setDebug:
 * @param {bool} value
 * 
 * Set's whether to debug or to not.
 */
function setDebug(value){
    DEBUG = value;
}

/**
 * _log:
 * @param {String} msg 
 * 
 * Logs general messages if debug is set to true.
 */
function _log(msg) {
    if(DEBUG)
        log(`CustomReboot NOTE: ${msg}`);
}

/**
 * _logWarning:
 * @param {String} msg 
 * 
 * Logs warning messages if debug is set to true.
 */
function _logWarning(msg) {
    if(DEBUG)
        log(`CustomReboot WARN: ${msg}`);
}