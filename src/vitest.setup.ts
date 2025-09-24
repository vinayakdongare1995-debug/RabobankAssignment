if (typeof File !== 'undefined' && !(File.prototype as any).text) {
  File.prototype.text = function (): Promise<string> {
    const file = this as File;
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onerror = () => {
        fr.abort();
        reject(new Error('Failed to read file'));
      };
      fr.onload = () => resolve(String(fr.result ?? ''));
      fr.readAsText(file);
    });
  };
}

if (typeof (globalThis as any).DataTransfer === 'undefined') {
  (globalThis as any).DataTransfer = function () {
    const dt: any = {};
    dt._files = [];
    dt.items = {
      add: (f: File) => {
        dt._files.push(f);
      },
    };
    Object.defineProperty(dt, 'files', {
      get() {
        const arr = dt._files;
        const fileList: any = {
          length: arr.length,
          item: (i: number) => arr[i] ?? null,
        };
        for (let i = 0; i < arr.length; i++) fileList[i] = arr[i];
        return fileList as FileList;
      },
    });
    return dt;
  };
}
