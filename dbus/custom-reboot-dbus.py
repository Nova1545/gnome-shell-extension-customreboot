# System includes
import sys

# Dbus includes
import gi.repository.GLib
import dbus
import dbus.service
import dbus.mainloop.glib

import utils as Utils

# Define our DBUS name
BASE = "com.nova1545.custom_reboot"
ECHO_BUS_NAME = f"{BASE}.BootService"

# Our DBUS interfaces
ENTRY_INTERFACE = f"{BASE}.BootEntryInterface"
QUIT_INTERFACE = f"{BASE}.QuitInterface"

# paths to some objects in our program
OBJECT_PATH = '/Custom_RebootObject'


class Custom_Reboot_Object(dbus.service.Object):
    @dbus.service.method(ENTRY_INTERFACE, in_signature='', out_signature='s')
    def echo(self):
        return Utils.get_current_boot_loader()

    @dbus.service.method(QUIT_INTERFACE, in_signature='', out_signature='')
    def quit(self):
        # this should be a separate object, but I'm
        # showing how one object can have multiple interfaces
        self.mainloop.quit()


def stop():
    bus = dbus.SessionBus()

    proxy = bus.get_object(ECHO_BUS_NAME, OBJECT_PATH)
    iface = dbus.Interface(proxy, QUIT_INTERFACE)

    iface.quit()


def server():
    dbus.mainloop.glib.DBusGMainLoop(set_as_default=True)

    bus = dbus.SessionBus()
    try:
        name = dbus.service.BusName(ECHO_BUS_NAME, bus, do_not_queue=True)
    except dbus.NameExistsException:
        sys.exit('Server is already running.')
    else:
        print('Server is not running yet. Putting on listening ears.')
    echo = Custom_Reboot_Object(bus, OBJECT_PATH)

    mainloop = gi.repository.GLib.MainLoop()
    echo.mainloop = mainloop
    mainloop.run()


def main(exe, args):
    if args == ['stop']:
        stop()
    elif not args:
        server()
    else:
        sys.exit('Usage: %s [stop]' % exe)


if __name__ == '__main__':
    main(sys.argv[0], sys.argv[1:])