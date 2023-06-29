# Custom Reboot GNOME Shell Extension
A expansion of https://github.com/docquantum/gnome-shell-extension-customreboot (Port to GNOME 43 and additional features)

---

TODO: Update example

| Bootloader   | Supported |
| ------------ | --------- |
| systemd-boot | Yes       |
| GRUB         | Yes       |
| efibootmgr   | Yes       |

A gnome-shell extension to add a "Custom Restart..." option to the shell system panel that allows you to choose what OS you want to boot into, after which it triggers the typical end session dialog for restart.

This extension needs permissions for gnome-shell to read your `/boot` partition, please verify your Linux distribution documentation.

There is now a button in the dropdown to make `grub.conf` readable (Requires authorization)

## Known Limitations
The GRUB reboot option is known to not work on Fedora or any Arch based distro. Please use `efibootmgr` or `systemdboot`

## Installing
Recommended:
1. Download from [Gnome Extensions](https://extensions.gnome.org/extension/5542/custom-reboot/)

Alternate Option:
1. Download from [releases](https://github.com/Nova1545/gnome-shell-extension-customreboot/releases)
2. Open a terminal where you downloaded the extension to and run (Add `--force` if updating) `gnome-extensions install customreboot@nova1545.shell-extension.zip` 

## Installing from Source 
``` bash
git clone https://github.com/Nova1545/gnome-shell-extension-customreboot.git
cd gnome-shell-extension-customreboot
chmod +x pack.sh
./pack.sh
gnome-extensions install --force customreboot@nova1545.shell-extension.zip
```


#### (Post-Install) Set Boot loader options
Open the extensions settings and choose from `efibootmgr` (default), `grub`, and `systemd-boot`. The extension will try all enabled boot loaders in the order show in the settings window, until one is found that works.

## Systemd-boot

It's able to set the one-shot default using [`bootctl set-oneshot ID`](https://www.freedesktop.org/software/systemd/man/bootctl.html#set-default%20ID).

The presented options are parsed from `bootctl list`.

When you select the operating system to reboot into, you'll be required to input your password because of required permissions to run `bootctl` which set EFI variables.

## GRUB

It's able to set the default menu entry using `grub-reboot title`

The presented options are parsed from the grub config.

When you select the operating system to reboot into, you'll be required to input your password because of required permissions to run `grub-reboot`.

## efibootmgr (New)
It's able to set the default using `efibootmgr -n 0001`

The presented options are parsed from `efibootmgr`

When you select the operating system to reboot into, you'll be required to input your password because of required permissions to run `efibootmgr` which set EFI variables.

## Caveats

I've only tested this on Ubuntu running GNOME 43 and GRUB. Please let me know if you run into issues on other distros, bootloaders, and GNOME shell versions.

Pull requests welcome!
