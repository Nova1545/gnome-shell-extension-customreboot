import Gio from "gi://Gio";
import { ExecCommand, Log, LogWarning } from './utils.js';

/**
 * Represents Systemdboot
 */
export class SystemdBoot {
  /**
   * Get's all available boot options
   * @returns {[Map, string]} Map(title, id), defaultOption
   */
  static async GetBootOptions() {
    let bootctl = await this.GetBinary();
    if (bootctl == "") {
        Log(`Failed to find bootctl binary`);
        return undefined;
    }

    try {
        let [status, stdout, stderr] = await ExecCommand([bootctl, "list"]);
        if (status !== 0)
            throw new Error(`Failed to get list from bootctl: ${status}\n${stdout}\n${stderr}`);
        Log(`bootctl list: ${status}\n${stdout}\n${stderr}`);
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
            bootOptions.set(titles[i], ids[i])
        }

        bootOptions.forEach((id, title) => {
            Log(`${id} = ${title}`);

            let defaultRes = defaultRx.exec(title);

            if (defaultRes) {
                defaultOpt = title;
            }
        })

        return [bootOptions, bootOptions.get(defaultOpt)];
    } catch (e) {
        LogWarning(e);
        return undefined;
    }
  }

  /**
   * Set's the next boot option
   * @param {string} id 
   * @returns True if the boot option was set, otherwise false
   */
   static async SetBootOption(id) {
    if (!this.IsUseable()) return false;
    const [status, stdout, stderr] = await ExecCommand(['/usr/bin/pkexec', '/usr/bin/bootctl', 'set-oneshot', id],);
    if (status === 0) {
        Log(`Set boot option to ${id}`);
        return true;
    }
    LogWarning("Unable to set boot option using bootctl");
    return false;
  }


  /**
   * Can we use this bootloader?
   * @returns True if useable otherwise false
   */
  static async IsUseable() {
    return await this.GetBinary() !== "";
  }

  /**
   * Get's bootctl binary path
   * @returns A string containing the location of the binary, if none is found returns a blank string
   */
  static async GetBinary() {
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
   * This boot loader cannot be quick rebooted
   */
  static async CanQuickReboot() {
    return false;
  }

  /**
   * This boot loader cannot be quick rebooted
   */ 
  static async QuickRebootEnabled() {
    return false;
  }
}
