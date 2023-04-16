import utils as Utils
from bootloader import BootLoader


class SystemdBoot(BootLoader):

    @staticmethod
    def get_boot_options(self):
        binary_path = Utils.get_boot_ctl_path()
        if binary_path == "":
            print("Failed to find bootctl binary")
            return

        [res, exit_code] = Utils.exec_command([binary_path, "list"])
    