declare var FSConfig, FSStoreOptions, FSTheme, FSPickerController, FSPickerDelegate;
import { Common, IFilestack, FSEvents } from '../common';

class FilestackDelegate extends NSObject {
  public static ObjCProtocols = [FSPickerDelegate];
  private _owner: WeakRef<Filestack>;

  public static initWithOwner(owner: WeakRef<Filestack>): FilestackDelegate {
    let delegate = <FilestackDelegate>FilestackDelegate.new();
    delegate._owner = owner;
    return delegate;
  }

  // Called when user dismisses the picker controller.
  public fsPickerDidCancel(picker) {
    console.log('fsPickerDidCancel');
  }

  // Called when picking of a single file resulted in error.
  // This does not mean that picking of the rest of the files (in case of multiple files available) is interrupted.
  // All files of multiple files pick, that resulted in error will call this method.
  public fsPickerPickingDidError(picker, error: NSError) {
    console.log('fsPickerPickingDidError', error);
  }

  // Called when picking of a single file completed with success.
  // If you are picking multiple files this will be called for each of successfully picked file.
  // public fsPickerPickedMediaWithBlob(picker, blob) {
  //   console.log('fsPickerPickedMediaWithBlob', blob);
  //   this._owner.get().addedFiles(blob);
  // }

  // Called when "files picking" is finished. Blobs array will contain blobs of all successfully picked files.
  public fsPickerDidFinishPickingMediaWithBlobs(picker, blobs: NSArray<any>) {
    console.log('fsPickerDidFinishPickingMediaWithBlobs:', blobs);
    this._owner.get().addedFiles(blobs);
  }
}

export class Filestack extends Common implements IFilestack {
  private _config: any;
  private _storeOptions: any;

  constructor(apiKey: string) {
    super();
    this._config = FSConfig.alloc().initWithApiKey(apiKey);

    this._storeOptions = FSStoreOptions.alloc().init();
    this._storeOptions.location = 'S3';

    this._config.storeOptions = this._storeOptions;
  }

  public open() {
    return new Promise((resolve, reject) => {
      let theme = FSTheme.filestackTheme();

      let ctrl = FSPickerController.alloc().initWithConfigTheme(this._config, theme);
      ctrl.fsDelegate = FilestackDelegate.initWithOwner(new WeakRef(this));
      // present the controller
      rootVC().presentViewControllerAnimatedCompletion(ctrl, true, resolve);
    });
  }

  public addedFiles(fpFiles: NSArray<any>) {
    console.log('From Filestack class:', fpFiles);
    let files = [];
    for (let i = 0; i < fpFiles.count; i++) {
      let file = fpFiles.objectAtIndex(i); 
      this.inspect(this.getFilestackFile(file));
      files.push(this.getFilestackFile(file));
    }
    this.notify({
      eventName: FSEvents.addedFiles,
      object: this,
      data: files
    });
  }
}

const rootVC = function () {
  let appWindow = UIApplication.sharedApplication.keyWindow;
  return appWindow.rootViewController;
}