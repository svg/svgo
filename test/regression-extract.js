import fs from 'fs';
import path from 'path';
import stream from 'stream';
import util from 'util';
import zlib from 'zlib';
import tarStream from 'tar-stream';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pipeline = util.promisify(stream.pipeline);

/** Files to skip regression testing for due to parsing issues. */
const exclude = [
  // animated
  'svgs/W3C_SVG_11_TestSuite/svg/filters-light-04-f.svg',
  'svgs/W3C_SVG_11_TestSuite/svg/filters-composite-05-f.svg',
  // messed gradients
  'svgs/W3C_SVG_11_TestSuite/svg/pservers-grad-18-b.svg',
  // removing wrapping <g> breaks :first-child pseudo-class
  'svgs/W3C_SVG_11_TestSuite/svg/styling-pres-04-f.svg',
  // rect is converted to path which matches wrong styles
  'svgs/W3C_SVG_11_TestSuite/svg/styling-css-08-f.svg',
  // complex selectors are messed because of converting shapes to paths
  'svgs/W3C_SVG_11_TestSuite/svg/struct-use-10-f.svg',
  'svgs/W3C_SVG_11_TestSuite/svg/struct-use-11-f.svg',
  'svgs/W3C_SVG_11_TestSuite/svg/styling-css-01-b.svg',
  'svgs/W3C_SVG_11_TestSuite/svg/styling-css-04-f.svg',
  // strange artifact breaks inconsistently breaks regression tests
  'svgs/W3C_SVG_11_TestSuite/svg/filters-conv-05-f.svg',
  // broken upon adding dataset and pending fix
  'svgs/oxygen-icons-5.113.0/scalable/actions/document-print-preview.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/hidef/tools-rip-audio-cd.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/im-ban-kick-user.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/im-ban-user.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/irc-close-channel.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/irc-remove-operator.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/irc-unvoice.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/list-add.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/list-remove-user.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/list-remove.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/mail-send.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/player-volume.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/16x16/document-edit-decrypt.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/16x16/document-edit-encrypt.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/16x16/document-edit-sign.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/16x16/document-edit-verify.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/16x16/im-ban-user.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/16x16/im-yahoo.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/16x16/irc-close-channel.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/16x16/irc-remove-operator.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/16x16/irc-unvoice.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/16x16/list-add-user.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/16x16/tools-media-optical-burn-image.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/22x22/edit-select-none.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/22x22/im-google.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/22x22/irc-close-channel.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/22x22/list-add-user.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/22x22/mail-receive.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/22x22/mixer-cd.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/22x22/news-unsubscribe.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/22x22/tools-media-optical-burn-image.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/22x22/tools-media-optical-copy.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/22x22/view-time-schedule-baselined-remove.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/32x32/documentation.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/32x32/edit-table-delete-column.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/32x32/edit-table-delete-row.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/32x32/im-ban-kick-user.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/32x32/im-ban-user.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/32x32/im-google.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/32x32/mail-mark-junk.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/32x32/tools-media-optical-burn-image.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/32x32/tools-rip-video-dvd.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/32x32/view-calendar-birthday.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/32x32/view-calendar-holiday.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/32x32/view-calendar-special-occasion.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/32x32/view-calendar-wedding-anniversary.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/48x48/im-google.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/small/48x48/tools-media-optical-burn-image.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/tools-media-optical-burn-image.svg',
  'svgs/oxygen-icons-5.113.0/scalable/actions/tools-rip-audio-cd.svg',
  'svgs/oxygen-icons-5.113.0/scalable/applets/org.kde.plasma.clipboard.svg',
  'svgs/oxygen-icons-5.113.0/scalable/applets/org.kde.plasma.devicenotifier.svg',
  'svgs/oxygen-icons-5.113.0/scalable/applets/org.kde.plasma.icontasks.svg',
  'svgs/oxygen-icons-5.113.0/scalable/applets/org.kde.plasma.kickerdash.svg',
  'svgs/oxygen-icons-5.113.0/scalable/applets/org.kde.plasma.quicklaunch.svg',
  'svgs/oxygen-icons-5.113.0/scalable/apps/basket.svg',
  'svgs/oxygen-icons-5.113.0/scalable/apps/calligraauthor.svg',
  'svgs/oxygen-icons-5.113.0/scalable/apps/hardware.svg',
  'svgs/oxygen-icons-5.113.0/scalable/apps/hidef/kmail2.svg',
  'svgs/oxygen-icons-5.113.0/scalable/apps/hidef/preferences-desktop-locale.svg',
  'svgs/oxygen-icons-5.113.0/scalable/apps/hwinfo.svg',
  'svgs/oxygen-icons-5.113.0/scalable/apps/kde-gtk-config.svg',
  'svgs/oxygen-icons-5.113.0/scalable/apps/kjournal.svg',
  'svgs/oxygen-icons-5.113.0/scalable/apps/kmail2.svg',
  'svgs/oxygen-icons-5.113.0/scalable/apps/kmymoney.svg',
  'svgs/oxygen-icons-5.113.0/scalable/apps/kplato.svg',
  'svgs/oxygen-icons-5.113.0/scalable/apps/krfb.svg',
  'svgs/oxygen-icons-5.113.0/scalable/apps/ksudoku.svg',
  'svgs/oxygen-icons-5.113.0/scalable/apps/okteta.svg',
  'svgs/oxygen-icons-5.113.0/scalable/apps/picmi.svg',
  'svgs/oxygen-icons-5.113.0/scalable/apps/preferences-desktop-user-password.svg',
  'svgs/oxygen-icons-5.113.0/scalable/apps/preferences-system-time.svg',
  'svgs/oxygen-icons-5.113.0/scalable/apps/small/16x16/kchart.svg',
  'svgs/oxygen-icons-5.113.0/scalable/apps/small/16x16/system-file-manager.svg',
  'svgs/oxygen-icons-5.113.0/scalable/apps/small/22x22/basket.svg',
  'svgs/oxygen-icons-5.113.0/scalable/apps/small/32x32/preferences-system-windows-move.svg',
  'svgs/oxygen-icons-5.113.0/scalable/apps/small/32x32/system-file-manager.svg',
  'svgs/oxygen-icons-5.113.0/scalable/apps/small/48x48/kig.svg',
  'svgs/oxygen-icons-5.113.0/scalable/apps/small/64x64/kplato.svg',
  'svgs/oxygen-icons-5.113.0/scalable/apps/strigi.svg',
  'svgs/oxygen-icons-5.113.0/scalable/apps/timevault.svg',
  'svgs/oxygen-icons-5.113.0/scalable/categories/applications-toys.svg',
  'svgs/oxygen-icons-5.113.0/scalable/categories/hidef/preferences-system.svg',
  'svgs/oxygen-icons-5.113.0/scalable/categories/preferences-system.svg',
  'svgs/oxygen-icons-5.113.0/scalable/devices/audio-card.svg',
  'svgs/oxygen-icons-5.113.0/scalable/devices/camera-web.svg',
  'svgs/oxygen-icons-5.113.0/scalable/devices/cpu.svg',
  'svgs/oxygen-icons-5.113.0/scalable/devices/hidef/input-keyboard.svg',
  'svgs/oxygen-icons-5.113.0/scalable/devices/hidef/media-optical-audio.svg',
  'svgs/oxygen-icons-5.113.0/scalable/devices/input-keyboard.svg',
  'svgs/oxygen-icons-5.113.0/scalable/devices/media-optical-audio.svg',
  'svgs/oxygen-icons-5.113.0/scalable/devices/scanner.svg',
  'svgs/oxygen-icons-5.113.0/scalable/devices/small/16x16/media-optical-audio.svg',
  'svgs/oxygen-icons-5.113.0/scalable/devices/small/16x16/media-optical-data.svg',
  'svgs/oxygen-icons-5.113.0/scalable/devices/small/22x22/media-optical-audio.svg',
  'svgs/oxygen-icons-5.113.0/scalable/devices/small/22x22/media-optical-data.svg',
  'svgs/oxygen-icons-5.113.0/scalable/devices/small/32x32/media-optical-audio.svg',
  'svgs/oxygen-icons-5.113.0/scalable/devices/small/48x48/media-optical-audio.svg',
  'svgs/oxygen-icons-5.113.0/scalable/mimetypes/application-x-cd-image.svg',
  'svgs/oxygen-icons-5.113.0/scalable/mimetypes/application-x-cue.svg',
  'svgs/oxygen-icons-5.113.0/scalable/mimetypes/application-x-kvtml.svg',
  'svgs/oxygen-icons-5.113.0/scalable/mimetypes/hidef/application-rtf.svg',
  'svgs/oxygen-icons-5.113.0/scalable/mimetypes/hidef/application-sxw.svg',
  'svgs/oxygen-icons-5.113.0/scalable/mimetypes/small/22x22/application-javascript.svg',
  'svgs/oxygen-icons-5.113.0/scalable/mimetypes/small/22x22/application-pdf.svg',
  'svgs/oxygen-icons-5.113.0/scalable/mimetypes/small/22x22/application-x-javascript.svg',
  'svgs/oxygen-icons-5.113.0/scalable/mimetypes/small/22x22/application-x-srt.svg',
  'svgs/oxygen-icons-5.113.0/scalable/mimetypes/small/22x22/text-css.svg',
  'svgs/oxygen-icons-5.113.0/scalable/mimetypes/small/22x22/text-plain.svg',
  'svgs/oxygen-icons-5.113.0/scalable/mimetypes/small/22x22/text-x-changelog.svg',
  'svgs/oxygen-icons-5.113.0/scalable/mimetypes/small/22x22/text-x-csharp.svg',
  'svgs/oxygen-icons-5.113.0/scalable/mimetypes/small/48x48/application-x-cd-image.svg',
  'svgs/oxygen-icons-5.113.0/scalable/mimetypes/small/48x48/application-x-cda.svg',
  'svgs/oxygen-icons-5.113.0/scalable/mimetypes/small/48x48/application-x-cue.svg',
  'svgs/oxygen-icons-5.113.0/scalable/mimetypes/small/48x48/help.svg',
  'svgs/oxygen-icons-5.113.0/scalable/mimetypes/small/64x64/application-x-cue.svg',
  'svgs/oxygen-icons-5.113.0/scalable/places/small/64x64/folder-tar.svg',
  'svgs/oxygen-icons-5.113.0/scalable/places/small/64x64/network-server-database.svg',
  'svgs/oxygen-icons-5.113.0/scalable/places/small/64x64/server-database.svg',
  'svgs/oxygen-icons-5.113.0/scalable/status/small/22x22/weather-showers-day.svg',
  'svgs/oxygen-icons-5.113.0/scalable/status/small/32x32/weather-showers-day.svg',
  'svgs/oxygen-icons-5.113.0/scalable/status/user-busy.svg',
  'svgs/oxygen-icons-5.113.0/scalable/status/user-online.svg',
  'svgs/oxygen-icons-5.113.0/scalable/text-formatting.svg',
];

/**
 * @param {string} url
 * @param {string} baseDir
 */
const extractTarGz = async (url, baseDir) => {
  const extract = tarStream.extract();
  extract.on('entry', async (header, stream, next) => {
    const name = header.name;

    try {
      if (
        name.endsWith('.svg') &&
        !exclude.includes(name) &&
        !name.startsWith('svgs/W3C_SVG_11_TestSuite/svg/animate-')
      ) {
        const file = path.join(baseDir, header.name);
        await fs.promises.mkdir(path.dirname(file), { recursive: true });
        await pipeline(stream, fs.createWriteStream(file));
      }
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
    stream.resume();
    next();
  });
  const response = await fetch(url);
  await pipeline(response.body, zlib.createGunzip(), extract);
};

(async () => {
  try {
    console.info('Downloading SVGO Test Suite and extracting files');
    await extractTarGz(
      'https://svg.github.io/svgo-test-suite/svgo-test-suite.tar.gz',
      path.join(__dirname, 'regression-fixtures'),
    );
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
