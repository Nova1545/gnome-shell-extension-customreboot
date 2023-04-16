# This file is a python port of the original grub.js file
import os
import shutil
from os.path import exists

import utils as Utils
import re

from bootloader import BootLoader


class Grub(BootLoader):
    # Parses the grub config to get the currently configured menu-entries
    @staticmethod
    def get_boot_options(self):
        config_path = Utils.get_grub_config()
        if config_path == "":
            print("Failed to find grub config")
            return

        boot_options = []
        default_entry = ""

        file = open(config_path, "r")
        lines = file.readlines()
        file.close()

        # Regex
        entry_exp = r"^menuentry ['\"]([^'\"]+)"
        default_exp = r"(?<=set default=\")([A-Za-z- ()/0-9]*)(?=\")"

        for l in lines:
            res = re.findall(entry_exp, l)
            if len(res) > 0:
                boot_options.append((res[0], res[0]))
            defu = re.findall(default_exp, l)
            if len(defu) > 0:
                default_entry = defu[0]

        if default_entry == "":
            default_entry = boot_options[0][0]

        return [boot_options, default_entry]

    @staticmethod
    def set_boot_option(self, id):
        [res, exit_code] = Utils.exec_command(["/usr/sbin/grub-reboot", id])
        if exit_code != 0:
            return False
        return True

    # Copies a custom grub script to allow the extension to quickly reboot into another OS
    @staticmethod
    def enable_quick_reboot(self):
        user = Utils.whoami()
        try:
            shutil.copy(
                f"/home/${user.trim()}/.local/share/gnome-shell/extensions/customreboot@nova1545/42_custom_reboot",
                "/etc/grub.d/42_custom_reboot")
            os.chmod("/etc/grub.d/42_custom_reboot", 0o755)

            [res, code] = Utils.exec_command(["/usr/sbin/update-grub"])
            if code != 0:
                return False
            return True
        except:
            return False

    # Removes the custom grub script to allow the extension to quickly reboot into another OS
    @staticmethod
    def disable_quick_reboot(self):
        try:
            os.remove("/etc/grub.d/42_custom_reboot")

            [res, code] = Utils.exec_command(["/usr/sbin/update-grub"])
            if code != 0:
                return False
            return True
        except:
            return False

    # Checks if /etc/grub.d/42_custom_reboot exists
    @staticmethod
    def is_quick_reboot(self):
        return exists("/etc/grub.d/42_custom_reboot")
