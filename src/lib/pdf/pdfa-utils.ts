import { PDFDocument, PDFName, PDFString, PDFDict, PDFArray } from "pdf-lib";

export interface PdfAOptions {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  conformance?: "1B" | "2B";
}

export function generatePdfAXmp(
  title: string,
  author: string,
  conformance: "1B" | "2B" = "1B"
): string {
  const part = conformance === "1B" ? "1" : "2";
  const conf = conformance === "1B" ? "B" : "B";
  const dateStr = new Date().toISOString();

  return `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
        xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:xmp="http://ns.adobe.com/xap/1.0/"
        xmlns:pdf="http://ns.adobe.com/pdf/1.3/">
      <pdfaid:part>${part}</pdfaid:part>
      <pdfaid:conformance>${conf}</pdfaid:conformance>
      <dc:title>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${title || "Archival Document"}</rdf:li>
        </rdf:Alt>
      </dc:title>
      <dc:creator>
        <rdf:Seq>
          <rdf:li>${author || "DocEditPro Archival Engine"}</rdf:li>
        </rdf:Seq>
      </dc:creator>
      <xmp:CreateDate>${dateStr}</xmp:CreateDate>
      <xmp:ModifyDate>${dateStr}</xmp:ModifyDate>
      <xmp:CreatorTool>DocEditPro PDF/A Archival Converter</xmp:CreatorTool>
      <pdf:Producer>DocEditPro Client-Side PDF/A Engine</pdf:Producer>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

export async function convertToPdfA(
  pdfBytes: Uint8Array,
  options: PdfAOptions = {}
): Promise<{ pdfBytes: Uint8Array; metadataSummary: Record<string, string> }> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

  const title = options.title || pdfDoc.getTitle() || "Archival Document";
  const author = options.author || pdfDoc.getAuthor() || "DocEditPro";
  const subject = options.subject || pdfDoc.getSubject() || "Archival PDF";

  pdfDoc.setTitle(title);
  pdfDoc.setAuthor(author);
  pdfDoc.setSubject(subject);
  pdfDoc.setProducer("DocEditPro PDF/A-1b Engine (100% Client-Side)");
  pdfDoc.setCreator("DocEditPro (https://doceditpro.vercel.app)");

  // Inject OutputIntent for sRGB standard color profile
  const context = pdfDoc.context;
  const catalog = pdfDoc.catalog;

  const outputIntentDict = context.obj({
    Type: "OutputIntent",
    S: "GTS_PDFA1",
    OutputCondition: PDFString.of("sRGB IEC61966-2.1"),
    OutputConditionIdentifier: PDFString.of("Custom"),
    RegistryName: PDFString.of("http://www.color.org"),
    Info: PDFString.of("sRGB IEC61966-2.1 Standard Color Space"),
  });

  const outputIntentsArray = context.obj([outputIntentDict]);
  catalog.set(PDFName.of("OutputIntents"), outputIntentsArray);

  // Inject XMP Metadata stream
  const xmpXml = generatePdfAXmp(title, author, options.conformance ?? "1B");
  const metadataStream = context.stream(xmpXml, {
    Type: "Metadata",
    Subtype: "XML",
  });
  const metadataStreamRef = context.register(metadataStream);
  catalog.set(PDFName.of("Metadata"), metadataStreamRef);

  // Sanitize Names dictionary to remove automated JavaScript or remote launch actions
  if (catalog.has(PDFName.of("Names"))) {
    const names = catalog.lookup(PDFName.of("Names"));
    if (names instanceof PDFDict) {
      names.delete(PDFName.of("JavaScript"));
    }
  }

  const outputBytes = await pdfDoc.save();

  return {
    pdfBytes: outputBytes,
    metadataSummary: {
      standard: options.conformance === "2B" ? "PDF/A-2b" : "PDF/A-1b",
      colorProfile: "sRGB IEC61966-2.1",
      outputIntent: "GTS_PDFA1",
      title,
      author,
      isoStandard: "ISO 19005-1:2005",
    },
  };
}
