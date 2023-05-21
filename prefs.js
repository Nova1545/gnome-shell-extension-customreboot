'use strict';

const { Adw, Gio, Gtk } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Utils = Me.imports.utils;

const grub_ = Me.imports.grub;
const systemdBoot = Me.imports.systemdBoot;
const efibootmgr = Me.imports.efibootmgr;

function init() {

}

function fillPreferencesWindow(window) {
    // Use the same GSettings schema as in `extension.js`
    const settings = ExtensionUtils.getSettings(
        'org.gnome.shell.extensions.customreboot');
    
    // Create a preferences page and group
    const page = new Adw.PreferencesPage();
    const group = new Adw.PreferencesGroup();
    page.add(group);

    // Create row for efibootmgr
    const efi = new Adw.ActionRow({ title: 'Use EFI Boot Manager (efibootmgr)' });

    // Create row for grub
    const grub = new Adw.ActionRow({ title: 'Use Grub'});

    // Create row for systemd-boot
    const sysd = new Adw.ActionRow({ title: 'Use Systemd Boot'});

    // Add rows
    group.add(efi);
    group.add(grub);
    group.add(sysd);

    // Create switch for efibootmgr
    const efi_switch = new Gtk.Switch({
        active: settings.get_boolean('use-efibootmgr'),
        valign: Gtk.Align.CENTER,
    });

    // Create switch for grub
    const grub_switch = new Gtk.Switch({
        active: settings.get_boolean('use-grub'),
        valign: Gtk.Align.CENTER,
    });

    // Create switch for systemd-boot
    const sysd_switch = new Gtk.Switch({
        active: settings.get_boolean('use-systemd-boot'),
        valign: Gtk.Align.CENTER,
    });

    // Bind settings for efibootmgr
    settings.bind(
        'use-efibootmgr',
        efi_switch,
        'active',
        Gio.SettingsBindFlags.DEFAULT
    );

    // Bind settings for grub
    settings.bind(
        'use-grub',
        grub_switch,
        'active',
        Gio.SettingsBindFlags.DEFAULT
    );

    // Bind settings for systemd-boot
    settings.bind(
        'use-systemd-boot',
        sysd_switch,
        'active',
        Gio.SettingsBindFlags.DEFAULT
    );

    // Add the switch for efibootmgr
    efi.add_suffix(efi_switch);
    efi.activatable_widget = efi_switch;

    // Add the switch for grub
    grub.add_suffix(grub_switch);
    grub.activatable_widget = grub_switch;

    // Add the switch for systemd-boot
    sysd.add_suffix(sysd_switch);
    sysd.activatable_widget = sysd_switch;

    // Add our page to the window
    window.add(page);

    (async () => {
        // Disable/enable switches in accordance to them being usable

        Utils._log(await efibootmgr.IsUseable());
        Utils._log(await grub_.IsUseable());
        Utils._log(await systemdBoot.IsUseable());

        efi_switch.set_sensitive(await efibootmgr.IsUseable());
        grub_switch.set_sensitive(await grub_.IsUseable());
        sysd_switch.set_sensitive(await systemdBoot.IsUseable());
    })();
}