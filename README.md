# Custom Reboot GNOME Shell Extension
A port of https://github.com/docquantum/gnome-shell-extension-customreboot to GNOME 43.

This extension uses all the original code for interacting with grub and bootctl. I simply ported it to GNOME 43

---

![Example](https://cdn.novastudios.uk/public/GNOMEExtension.png)

| Bootloader   | Supported |
| ------------ | --------- |
| systemd-boot | Yes       |
| GRUB         | Yes       |

A gnome-shell extension to add a "Custom Restart..." option to the shell system panel that allows you to choose what OS you want to boot into, after which it triggers the typical end session dialog for restart.

This extension needs permissions for gnome-shell to read your `/boot` partition, please verify your Linux distribution documentation.

There is now a button in the dropdown to make `grub.conf` readable (Requires authorization)

## Systemd-boot

It's able to set the one-shot default using [`bootctl set-oneshot ID`](https://www.freedesktop.org/software/systemd/man/bootctl.html#set-default%20ID).

The presented options are parsed from `bootctl list`.

When you select the operating system to reboot into, you'll be required to input your password because of required permissions to run `bootctl` which set EFI variables.

## GRUB

It's able to set the default menu entry using `grub-reboot title`

The presented options are parsed from the grub config.

When you select the operating system to reboot into, you'll be required to input your password because of required permissions to run `grub-reboot`.

## Caveats

I've only tested this on Ubuntu Linux running gnome 43 and grub. Please let me know if you run into issues on other distros, bootloaders, and GNOME shell versions.

Pull requests welcome!
