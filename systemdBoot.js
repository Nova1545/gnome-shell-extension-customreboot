/* systemdBoot.js
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

/* exported getBootOptions, setBootOption */

'use strict';

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Utils = Me.imports.utils;

/**
 * getBootOptions:
 * @returns {[Map, String]} Map(title, id), defaultOption
 * 
 * Runs a `bootctl list` process to get the currently
 * installed boot options in systemd-boot. This will only
 * work with the current boot, so if any new options are added,
 * they will only show up on the next boot.
 */
async function getBootOptions() {
    let bootctl = Utils.getBootctlPath();
    if (bootctl == "") {
        Utils._log(`Failed to find bootctl binary`);
        return undefined;
    }

    try {
        let [status, stdout, stderr] = await Utils.execCommand([bootctl, "list"]);
        if (status !== 0)
            throw new Error(`Failed to get list from bootctl: ${status}\n${stdout}\n${stderr}`);
        Utils._log(`bootctl list: ${status}\n${stdout}\n${stderr}`);
        let lines = String(stdout).split('\n');
        let titleRx = /(?<=title:\s+).+/;
        let idRx = /(?<=id:\s+).+/;
        let defaultRx = /\(default\)/;
        let titles = [];
        let ids = []
        let defaultOpt;
        lines.forEach(l => {
            let title = titleRx.exec(l);
            let id = idRx.exec(l);
            if (title && title.length) {
                titles.push(String(title));
            } else if (id && id.length) {
                ids.push(String(id));
            }
        });
        if (titles.length !== ids.length)
            throw new Error("Number of titles and ids do not match!");
        let bootOptions = new Map();
        for (let i = 0; i < titles.length; i++) {
            bootOptions.set(ids[i], titles[i])
        }

        bootOptions.forEach((title, id) => {
            Utils._log(`${id} = ${title}`);

            let defaultRes = defaultRx.exec(title);

            if (defaultRes) {
                defaultOpt = id;
            }
        })

        return [bootOptions, bootOptions.get(defaultOpt)];
    } catch (e) {
        logError(e);
        return undefined;
    }
}

/**
 * setBootOption:
 * 
 * @param {string} id
 * @returns {bool} whether it was able to set it or not
 * 
 * The unique ID to be passed to `bootctl` so that that
 * boot option is set to be the one to boot off of next boot. 
 */
async function setBootOption(id) {
    try {
        let [status, stdout, stderr] = await Utils.execCommand(
            ['/usr/bin/pkexec', '/usr/sbin/bootctl', 'set-oneshot', id],
        );
        if (status !== 0)
            throw new String(`Failed to set boot option to ${id}:\nExitCode: ${status}\nstdout: ${stdout}\nstderr: ${stderr}`);
        Utils._log(`Set boot option to ${id}: ${status}\n${stdout}\n${stderr}`);
        return true;
    } catch (e) {
        Utils._logWarning(e);
        return false;
    }
}