import WebViewer from "@pdftron/webviewer";

import { useEffect, useRef } from "react";

export const PDFViewer = () => {
  const viewer = useRef(null);

  useEffect(() => {
    if (!viewer.current) return;

    WebViewer(
      {
        path: "/webviewer/lib",
        licenseKey: "YOUR_LICENSE_KEY",
        initialDoc:
          "https://pdftron.s3.amazonaws.com/downloads/pl/demo-annotated.pdf",
      },
      viewer.current
    ).then((instance) => {
      const { documentViewer } = instance.Core;
      // you can now call WebViewer APIs here...
    });
  }, []);

  return (
    <div className="MyComponent">
      <div className="header">React sample</div>
      <div className="webviewer" ref={viewer} style={{ height: "100vh" }}></div>
    </div>
  );
};
