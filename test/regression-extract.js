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
  'W3C_SVG_11_TestSuite/svg/filters-light-04-f.svg',
  'W3C_SVG_11_TestSuite/svg/filters-composite-05-f.svg',
  // messed gradients
  'W3C_SVG_11_TestSuite/svg/pservers-grad-18-b.svg',
  // rect is converted to path which matches wrong styles
  'W3C_SVG_11_TestSuite/svg/styling-css-08-f.svg',
  // complex selectors are messed because of converting shapes to paths
  'W3C_SVG_11_TestSuite/svg/struct-use-10-f.svg',
  'W3C_SVG_11_TestSuite/svg/struct-use-11-f.svg',
  'W3C_SVG_11_TestSuite/svg/styling-css-01-b.svg',
  'W3C_SVG_11_TestSuite/svg/styling-css-04-f.svg',
  // strange artifact inconsistently breaks regression tests
  'W3C_SVG_11_TestSuite/svg/filters-conv-05-f.svg',
  // broken upon adding dataset and pending fix
  'oxygen-icons-5.116.0/scalable/actions/hidef/tools-rip-audio-cd.svg',
  'oxygen-icons-5.116.0/scalable/actions/im-ban-kick-user.svg',
  'oxygen-icons-5.116.0/scalable/actions/im-ban-user.svg',
  'oxygen-icons-5.116.0/scalable/actions/irc-close-channel.svg',
  'oxygen-icons-5.116.0/scalable/actions/irc-remove-operator.svg',
  'oxygen-icons-5.116.0/scalable/actions/irc-unvoice.svg',
  'oxygen-icons-5.116.0/scalable/actions/list-add.svg',
  'oxygen-icons-5.116.0/scalable/actions/list-remove-user.svg',
  'oxygen-icons-5.116.0/scalable/actions/list-remove.svg',
  'oxygen-icons-5.116.0/scalable/actions/mail-send.svg',
  'oxygen-icons-5.116.0/scalable/actions/player-volume.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/16x16/document-edit-decrypt.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/16x16/document-edit-encrypt.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/16x16/document-edit-sign.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/16x16/document-edit-verify.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/16x16/im-ban-user.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/16x16/im-yahoo.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/16x16/irc-close-channel.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/16x16/irc-remove-operator.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/16x16/irc-unvoice.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/16x16/list-add-user.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/16x16/tools-media-optical-burn-image.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/22x22/edit-select-none.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/22x22/im-google.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/22x22/irc-close-channel.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/22x22/list-add-user.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/22x22/mail-receive.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/22x22/mixer-cd.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/22x22/news-unsubscribe.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/22x22/tools-media-optical-burn-image.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/22x22/tools-media-optical-copy.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/22x22/view-time-schedule-baselined-remove.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/32x32/documentation.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/32x32/edit-table-delete-column.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/32x32/edit-table-delete-row.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/32x32/im-ban-kick-user.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/32x32/im-ban-user.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/32x32/im-google.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/32x32/mail-mark-junk.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/32x32/tools-media-optical-burn-image.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/32x32/tools-rip-video-dvd.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/32x32/view-calendar-birthday.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/32x32/view-calendar-holiday.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/32x32/view-calendar-special-occasion.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/32x32/view-calendar-wedding-anniversary.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/48x48/im-google.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/48x48/preflight-verifier.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/48x48/tools-media-optical-burn-image.svg',
  'oxygen-icons-5.116.0/scalable/actions/tools-media-optical-burn-image.svg',
  'oxygen-icons-5.116.0/scalable/actions/tools-rip-audio-cd.svg',
  'oxygen-icons-5.116.0/scalable/actions/user-properties.svg',
  'oxygen-icons-5.116.0/scalable/actions/view-pim-mail.svg',
  'oxygen-icons-5.116.0/scalable/applets/org.kde.plasma.clipboard.svg',
  'oxygen-icons-5.116.0/scalable/applets/org.kde.plasma.devicenotifier.svg',
  'oxygen-icons-5.116.0/scalable/applets/org.kde.plasma.icontasks.svg',
  'oxygen-icons-5.116.0/scalable/applets/org.kde.plasma.kickerdash.svg',
  'oxygen-icons-5.116.0/scalable/applets/org.kde.plasma.quicklaunch.svg',
  'oxygen-icons-5.116.0/scalable/apps/accessories-text-editor.svg',
  'oxygen-icons-5.116.0/scalable/apps/basket.svg',
  'oxygen-icons-5.116.0/scalable/apps/graphics-viewer-document.svg',
  'oxygen-icons-5.116.0/scalable/apps/hardware.svg',
  'oxygen-icons-5.116.0/scalable/apps/hidef/kmail2.svg',
  'oxygen-icons-5.116.0/scalable/apps/hidef/preferences-desktop-locale.svg',
  'oxygen-icons-5.116.0/scalable/apps/hwinfo.svg',
  'oxygen-icons-5.116.0/scalable/apps/kde-gtk-config.svg',
  'oxygen-icons-5.116.0/scalable/apps/kjournal.svg',
  'oxygen-icons-5.116.0/scalable/apps/kmail2.svg',
  'oxygen-icons-5.116.0/scalable/apps/kmymoney.svg',
  'oxygen-icons-5.116.0/scalable/apps/kplato.svg',
  'oxygen-icons-5.116.0/scalable/apps/ksudoku.svg',
  'oxygen-icons-5.116.0/scalable/apps/okteta.svg',
  'oxygen-icons-5.116.0/scalable/apps/picmi.svg',
  'oxygen-icons-5.116.0/scalable/apps/preferences-desktop-user-password.svg',
  'oxygen-icons-5.116.0/scalable/apps/preferences-system-time.svg',
  'oxygen-icons-5.116.0/scalable/apps/scribus.svg',
  'oxygen-icons-5.116.0/scalable/apps/small/22x22/basket.svg',
  'oxygen-icons-5.116.0/scalable/apps/small/32x32/preferences-system-windows-move.svg',
  'oxygen-icons-5.116.0/scalable/apps/small/48x48/kig.svg',
  'oxygen-icons-5.116.0/scalable/apps/small/64x64/kplato.svg',
  'oxygen-icons-5.116.0/scalable/apps/strigi.svg',
  'oxygen-icons-5.116.0/scalable/apps/timevault.svg',
  'oxygen-icons-5.116.0/scalable/categories/applications-toys.svg',
  'oxygen-icons-5.116.0/scalable/devices/audio-card.svg',
  'oxygen-icons-5.116.0/scalable/devices/camera-web.svg',
  'oxygen-icons-5.116.0/scalable/devices/hidef/input-keyboard.svg',
  'oxygen-icons-5.116.0/scalable/devices/hidef/media-optical-audio.svg',
  'oxygen-icons-5.116.0/scalable/devices/input-keyboard.svg',
  'oxygen-icons-5.116.0/scalable/devices/media-optical-audio.svg',
  'oxygen-icons-5.116.0/scalable/devices/scanner.svg',
  'oxygen-icons-5.116.0/scalable/devices/small/16x16/media-optical-audio.svg',
  'oxygen-icons-5.116.0/scalable/devices/small/16x16/media-optical-data.svg',
  'oxygen-icons-5.116.0/scalable/devices/small/22x22/media-optical-audio.svg',
  'oxygen-icons-5.116.0/scalable/devices/small/22x22/media-optical-data.svg',
  'oxygen-icons-5.116.0/scalable/devices/small/32x32/media-optical-audio.svg',
  'oxygen-icons-5.116.0/scalable/devices/small/48x48/media-optical-audio.svg',
  'oxygen-icons-5.116.0/scalable/mimetypes/application-x-cd-image.svg',
  'oxygen-icons-5.116.0/scalable/mimetypes/application-x-cue.svg',
  'oxygen-icons-5.116.0/scalable/mimetypes/application-x-kvtml.svg',
  'oxygen-icons-5.116.0/scalable/mimetypes/hidef/application-sxw.svg',
  'oxygen-icons-5.116.0/scalable/mimetypes/hidef/text-enriched.svg',
  'oxygen-icons-5.116.0/scalable/mimetypes/small/22x22/application-javascript.svg',
  'oxygen-icons-5.116.0/scalable/mimetypes/small/22x22/application-pdf.svg',
  'oxygen-icons-5.116.0/scalable/mimetypes/small/22x22/application-x-javascript.svg',
  'oxygen-icons-5.116.0/scalable/mimetypes/small/22x22/application-x-srt.svg',
  'oxygen-icons-5.116.0/scalable/mimetypes/small/22x22/text-css.svg',
  'oxygen-icons-5.116.0/scalable/mimetypes/small/22x22/text-plain.svg',
  'oxygen-icons-5.116.0/scalable/mimetypes/small/22x22/text-x-changelog.svg',
  'oxygen-icons-5.116.0/scalable/mimetypes/small/22x22/text-x-csharp.svg',
  'oxygen-icons-5.116.0/scalable/mimetypes/small/32x32/application-x-applix-word.svg',
  'oxygen-icons-5.116.0/scalable/mimetypes/small/32x32/application-x-lyx.svg',
  'oxygen-icons-5.116.0/scalable/mimetypes/small/48x48/application-x-cd-image.svg',
  'oxygen-icons-5.116.0/scalable/mimetypes/small/48x48/application-x-cda.svg',
  'oxygen-icons-5.116.0/scalable/mimetypes/small/48x48/application-x-cue.svg',
  'oxygen-icons-5.116.0/scalable/mimetypes/small/48x48/help.svg',
  'oxygen-icons-5.116.0/scalable/mimetypes/small/64x64/application-x-cue.svg',
  'oxygen-icons-5.116.0/scalable/places/small/64x64/folder-tar.svg',
  'oxygen-icons-5.116.0/scalable/places/small/64x64/network-server-database.svg',
  'oxygen-icons-5.116.0/scalable/places/small/64x64/server-database.svg',
  // broken on ci, but unable to reproduce locally
  'oxygen-icons-5.116.0/scalable/actions/small/16x16/mail-encrypted-full.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/16x16/mail-encrypted-part.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/16x16/mail-encrypted.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/16x16/mail-signature-unknown.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/16x16/mail-signed-full.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/16x16/mail-signed-part.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/16x16/mail-signed.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/16x16/mail-tagged.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/16x16/view-calendar-list.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/22x22/mail-forward.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/22x22/mail-queue.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/22x22/view-calendar-list.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/32x32/view-time-schedule-baselined-add.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/32x32/view-time-schedule-baselined-remove.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/32x32/view-time-schedule-baselined.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/32x32/view-time-schedule-calculus.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/32x32/view-time-schedule-child-insert.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/32x32/view-time-schedule-edit.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/32x32/view-time-schedule-insert.svg',
  'oxygen-icons-5.116.0/scalable/actions/small/32x32/view-time-schedule.svg',
  'oxygen-icons-5.116.0/scalable/apps/utilities-log-viewer.svg',
  'W3C_SVG_11_TestSuite/svg/color-prop-04-t.svg',
  'W3C_SVG_11_TestSuite/svg/coords-units-03-b.svg',
  'W3C_SVG_11_TestSuite/svg/filters-displace-01-f.svg',
  'W3C_SVG_11_TestSuite/svg/fonts-kern-01-t.svg',
  'W3C_SVG_11_TestSuite/svg/interact-pevents-01-b.svg',
];

/**
 * @param {string} url
 * @param {string} baseDir
 */
const extractTarGz = async (url, baseDir) => {
  const extract = tarStream.extract();
  extract.on('entry', async (header, stream, next) => {
    const name = header.name.slice(16);

    try {
      if (
        name.endsWith('.svg') &&
        !exclude.includes(name) &&
        !name.startsWith('W3C_SVG_11_TestSuite/svg/animate-')
      ) {
        const file = path.join(baseDir, name);
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
