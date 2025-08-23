// import * as puppeteer from 'puppeteer';
import puppeteer from 'puppeteer'

export class CdPdf {
    constructor() {

    }

    async fromUrl(req: any, res: any) {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto('https://google.com');
        await page.pdf({ path: 'google.pdf' });
        await browser.close();
    }

    /**
     * {
            "ctx": "Sys",
            "m": "Comm",
            "c": "Output",
            "a": "Pdf",
            "dat": {
                "f_vals": [
                    {
                        "data": {
                            "pdfName": "test",
                            "pdfHtml": "<div bgcolor=\"#f6f6f6\" style=\"color: #333; height: 100%; width: 100%;\" height=\"100%\" width=\"100%\"><table bgcolor=\"#f6f6f6\" cellspacing=\"0\" style=\"border-collapse: collapse; padding: 40px; width: 100%;\" width=\"100%\"> <tbody> <tr> <td width=\"5px\" style=\"padding: 0;\"></td> <td style=\"clear: both; display: block; margin: 0 auto; max-width: 600px; padding: 10px 0;\">  <table width=\"100%\" cellspacing=\"0\" style=\"border-collapse: collapse;\"> <tbody> <tr> <td style=\"padding: 0;\"> <!-- <a href=\"#\" style=\"color: #348eda;\" target=\"_blank\"> <img src=\"//ssl.gstatic.com/accounts/ui/logo_2x.png\" alt=\"Bootdey.com\" style=\"height: 50px; max-width: 100%; width: 157px;\" height=\"50\" width=\"157\" /> </a> --> </td> <td style=\"color: #999; font-size: 12px; padding: 0; text-align: right;\" align=\"right\"> <!-- <br /> <br /> --> </td> </tr> </tbody> </table> </td> <td width=\"5px\" style=\"padding: 0;\"></td> </tr> <tr> <td width=\"5px\" style=\"padding: 0;\"></td> <td bgcolor=\"#FFFFFF\" style=\"border: 0px solid #000; clear: both; display: block; margin: 0 auto; max-width: 700px; padding: 0;\"> <table width=\"100%\" style=\"background: #f9f9f9; border-bottom: 1px solid #eee; border-collapse: collapse; color: #999;\"> <tbody> <tr> <td width=\"50%\" style=\"padding: 20px;\"><strong style=\"color: #333; font-size: 24px;\"></strong> </td> <td align=\"right\" width=\"50%\" style=\"padding: 20px;\"> <span class=\"il\"></span></td> </tr> </tbody> </table> </td> <td style=\"padding: 0;\"></td> <td width=\"5px\" style=\"padding: 0;\"></td> </tr> <tr> <td width=\"5px\" style=\"padding: 0;\"></td>  <td style=\"border: 0px solid #000; border-top: 0; clear: both; display: block; margin: 0 auto; max-width: 700px; padding: 0;\"> <div class=\"invoice overflow-auto\"> <div style=\"min-width: 600px\"> <header> <div class=\"row\"> <div class=\"col\"> <a target=\"_blank\" href=\"https://nganioluoch.com\"> <img src=\"http://127.0.0.1:5500/img/ngani-oluoch-logo.png\" data-holder-rendered=\"true\"> </a> </div> <div class=\"col company-details\"> <h6 class=\"name contact-header\"> NG'ANI &amp; OLUOCH ADVOCATES </h6> <div class=\"contact-text\">Agip House 5th Floor</div> <div class=\"contact-text\">P.O. BOX 717, 00200, Nairobi</div> <div class=\"contact-text\">info@nganioluoch.com</div> </div> </div> </header> <main> <div class=\"row contacts\"> <div class=\"col invoice-to\"> <div class=\"text-gray-light contact-text\">INVOICE TO:</div> <h6 id=\"ctl_invoice_companyName\" class=\"to contact-header\">Helena Hospital </h6> <div id=\"ctl_invoice_postalAddress\" class=\"address contact-text\">Lenana Road, Nairobi</div> <div id=\"ctl_invoice_email\" class=\"email contact-text\"> helena.hospital@gmail.com</div> </div> <div class=\"col invoice-details\"> <h6 id=\"ctl_invoice_billId\" class=\"invoice-id\">Inv. No. 883-023</h6> <div id=\"ctl_invoice_billDate\" class=\"date contact-text\">Date of Invoice: 01/10/2018</div> <div id=\"ctl_invoice_billExpDate\" class=\"date contact-text\">Due Date: 30/10/2018</div> </div> </div> <table id=\"invoiceTable\" class=\"inv-table\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\"> <thead id=\"invoiceTableHeader\" class=\"thead-text\"> <tr> <th>#</th> <th class=\"text-left\">Subject</th> <th class=\"text-right\">Per Hr Rate(KES)</th> <th class=\"text-right\">Hours</th> <th class=\"text-right\">Cost(KES)</th> </tr> </thead> <tbody id=\"invoiceTableBody\"> <tr> <td class=\"no\">01</td> <td class=\"text-left\"> <h6> <!-- <a target=\"_blank\" href=\"https://www.youtube.com/channel/UC_UMEcP_kF0z4E6KbxCpV1w\"> Youtube channel </a> --> Initial consultation </h6>  <!-- <a target=\"_blank\" href=\"https://www.youtube.com/channel/UC_UMEcP_kF0z4E6KbxCpV1w\"> presentation of the </a> --> presentation of the case </td> <td class=\"unit\">5000.00</td> <td class=\"qty\">1.2</td> <td class=\"total\">6000.00</td> </tr> <tr> <td class=\"no\">02</td> <td class=\"text-left\"> <h6>Planning and preparation</h6> including logistics </td> <td class=\"unit\">2000</td> <td class=\"qty\">10</td> <td class=\"total\">20,000.00</td> </tr> <tr> <td class=\"no\">03</td> <td class=\"text-left\"> <h6>Case mention</h6> </td> <td class=\"unit\">2500.00</td> <td class=\"qty\">2</td> <td class=\"total\">5000.00</td> </tr> </tbody> <tfoot id=\"invoiceTableFooter\"> <tr> <td colspan=\"2\"></td> <td colspan=\"2\">Sub Total</td> <td>31,000.00</td> </tr> <tr> <td colspan=\"2\"></td> <td colspan=\"2\">TAX 18%</td> <td>5,580.00</td> </tr> <tr> <td colspan=\"2\"></td> <td colspan=\"2\">Discount 10%</td> <td>1,300.00</td> </tr> <tr> <td colspan=\"2\"></td> <td colspan=\"2\">GRAND TOTAL</td> <td>32900.00</td> </tr> </tfoot> </table> <!-- <div class=\"thanks\">Thank you!</div> --> <div class=\"notices\"> <div>NOTICE:</div> <div class=\"notice\">A finance charge of 1.5% will be made on unpaid balances after 30 days. </div> </div> </main> <footer> Invoice was created on a computer and is valid without the signature and seal. </footer> </div> <!--DO NOT DELETE THIS div. IT is responsible for showing footer always at the bottom--> <div></div> </div> </td> <td width=\"5px\" style=\"padding: 0;\"></td> </tr> <tr style=\"color: #666; font-size: 12px;\"> <td width=\"5px\" style=\"padding: 10px 0;\"></td> <td style=\"clear: both; display: block; margin: 0 auto; max-width: 600px; padding: 10px 0;\"> <table width=\"100%\" cellspacing=\"0\" style=\"border-collapse: collapse;\"> <tbody> <tr> <td width=\"40%\" valign=\"top\" style=\"padding: 10px 0;\"> <!-- <h4 style=\"margin: 0;\">Questions?</h4> --> <!-- <p style=\"color: #666; font-size: 12px; font-weight: normal; margin-bottom: 10px;\"> Please visit our <a href=\"#\" style=\"color: #666;\" target=\"_blank\"> Support Center </a> with any questions. </p> --> </td> <td width=\"10%\" style=\"padding: 10px 0;\">&nbsp;</td> <td width=\"40%\" valign=\"top\" style=\"padding: 10px 0;\"> <!-- <h4 style=\"margin: 0;\"><span class=\"il\">Bootdey</span> Technologies</h4> --> <!-- <p style=\"color: #666; font-size: 12px; font-weight: normal; margin-bottom: 10px;\"> <a href=\"#\">535 Mission St., 14th Floor San Francisco, CA 94105</a> </p> -->  </td> </tr> </tbody> </table> </td> <td width=\"5px\" style=\"padding: 10px 0;\"></td> </tr> </tbody> </table> </div>",
                            "pdfCss": [
                                "output/css/bootstrap.min.css",
                                "output/css/boxicons/css/boxicons.min.css",
                                "output/css/client-table.css",
                                "output/css/invoice-tabs.css",
                                "output/css/invoice.css",
                                "output/css/simple-tabs.css",
                                "output/css/print.css"
                            ]
                        }
                    }
                ],
                "token": "3ffd785f-e885-4d37-addf-0e24379af338"
            },
            "args": {}
        }
     * @param req 
     * @param res 
     */
    async fromHtml(req: any, res: any) {
        const browser = await puppeteer.launch()
        const page = await browser.newPage()

        // // 1. Create PDF from URL
        // await page.goto('http://127.0.0.1:5500/pdfTemplate2.html')
        // await page.pdf({ path: 'api.pdf', format: 'a4' })

        // 2. Create PDF from static HTML
        // console.log('CdPdf::fromHtml()/req.post.dat.f_vals[0]:', req.post.dat.f_vals[0].pdfHtml)
        let htmlContent = req.post.dat.f_vals[0].data.pdfHtml;
        // console.log('CdPdf::fromHtml()/htmlContent:', htmlContent)
        let csss:string[] = req.post.dat.f_vals[0].data.pdfCss;
        await page.setContent(htmlContent)
        await csss.forEach(async (css) => {
            console.log('css..01')
            console.log('css:', css)
            await page.addStyleTag({path: css})
            console.log('css..02')
        })
        await page.pdf({ path: 'output/bill.pdf', format: 'a5' })
        await browser.close()
    }

    async withCss(req: any, res: any) {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        // add css
        const contents = `
                            <table class="class4" style="width: 100%;">
                                < tbody >
                                    <tr>
                                        <td style="width: 33.3333%;" class="" >
                                            <br>
                                        </td>
                                        < td style = "width: 33.3333%;" >
                                            <br>
                                        < td style = "width: 33.3333%;" >
                                            <br></>
                                    < /tr>
                                < /tbody>
                            < /table>
        `

        // add css
        const cssStyle = `
                            <style>
                                .class4 thead tr th,.class4 tbody tr td {
                                border-style: solid;
                                border-color: coral;
                                border-width: 1px;
                                }
                            </style>
      `;

        // add css
        const addCssContent = cssStyle + contents;

        await page.goto(`data:text/html;base64;charset=UTF-8,${Buffer.from(addCssContent).toString()}`
        ,
            {
                waitUntil: "load",
                timeout: 300000
            }
        );

        await page.pdf({ path: 'wCss.pdf', format: 'a4' })
        await browser.close()
    }

    async exampleCss() {
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setViewport({ width: 761, height: 800 });
        await page.goto('http://healoba.com/fa/encyclopedia/medicine/temper#education_article');
        await page.addStyleTag({ path: 'css.css' });
        await page.screenshot({ path: 'pic.png' });
        await browser.close();
    }
}