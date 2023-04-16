# This file is a python port of the original utils.js file
import os
import subprocess
from enum import Enum
from os.path import exists

from grub import Grub
from systemdBoot import SystemdBoot



class BootLoaderType(Enum):
    SYSTEMD_BOOT = 0
    GRUB = 1


BootLoaderClass = [SystemdBoot, Grub]
BootLoaderNames = ["SYSTEMD_BOOT", "BootLoaderType"]


# Returns the path of the bootctl binary or an empty string if not found
def get_boot_ctl_path():
    paths = ["/usr/sbin/bootctl", "/usr/bin/bootctl"]

    for p in paths:
        if exists(p):
            return p

    return ""


# Returns the path of the grub config or an empty string if not exist
def get_grub_config():
    paths = ["/boot/grub/grub.cfg", "/boot/grub2/grub.cfg"]

    for p in paths:
        if exists(p):
            return p

    return ""


# Returns the current bootloader based on system configuration and setting preferences
def get_current_boot_loader():
    return BootLoaderClass[get_current_boot_loader_type()]


# Returns the current bootloader based on system configuration and setting preferences
def get_current_boot_loader_type():
    grub_cfg = get_grub_config()

    if grub_cfg != "":
        return BootLoaderType.GRUB
    return BootLoaderType.SYSTEMD_BOOT


# Given a bootloader type, returns the name in string form
def get_boot_loader_name(type):
    return BootLoaderNames[type]


# Executes a command
def exec_command(arguments):
    try:
        process = subprocess.Popen(arguments, stdout=subprocess.PIPE)
        return [process.stdout.readlines(), process.wait()]
    except:
        return None


# Returns the logged in user
def whoami():
    return os.getlogin()
