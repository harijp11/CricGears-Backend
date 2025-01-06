const Order = require("../../Models/orderModel");
// const PDFDocument = require("pdfkit");
const PdfPrinter = require("pdfmake");
const PDFDocument = require("pdfkit-table");
const ExcelJS = require("exceljs");

function generateDateFilterQuery(filterType, startDate, endDate) {
  const now = new Date();

  const filteredQuery = {
    orderItems: {
      $elemMatch: {
        orderStatus: "Delivered",
      },
    },
  };

  if (filterType === "custom" && startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    filteredQuery.placedAt = { $gte: start, $lte: end };
  } else if (filterType === "daily") {
    const start = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));
    filteredQuery.placedAt = { $gte: start, $lte: endOfDay };
  } else if (filterType == "weekly") {
    const startWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endWeek = new Date(startWeek);

    endWeek.setDate(startWeek.getDate() + 6);
    filteredQuery.placedAt = { $gte: startWeek, $lte: endWeek };
  } else if (filterType === " monthly") {
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
    filteredQuery.placedAt = { $gte: startMonth, $lte: endMonth };
  } else if (filterType === "yearly") {
    const startYear = new Date(now.getFullYear(), 0, 1);
    const endYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    filteredQuery.placedAt = { $gte: startYear, $lte: endYear };
  }
  return filteredQuery;
}

async function fetchSalesReport(req, res) {
  try {
    console.log(req.query);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const { filterType, startDate, endDate } = req.query;

    const filteredQuery = generateDateFilterQuery(
      filterType,
      startDate,
      endDate
    );

    const totalSalesCount = await Order.find(filteredQuery);

    const orders = await Order.find(filteredQuery)
      .populate("user")
      .populate("shippingAddress")
      .populate("orderItems.product")
      .sort({ placedAt: -1 })
      .skip(skip)
      .limit(limit);

    let totalSales = orders.reduce((total, order) => {
      const orderTotal = order.orderItems.reduce((orderTotal, orderItem) => {
        return orderTotal + orderItem.price * orderItem.qty;
      }, 0);
      return total + orderTotal;
    }, 0);

    res.status(200).json({
      success: true,
      orders,
      totalSales,
      currentPage: page,
      totalPages: Math.ceil(totalSalesCount.length / limit),
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Internal Server Error" });
  }
}

const downloadSalesPDF = async (req, res) => {
  try {
    const { filterType, startDate, endDate } = req.query;
    const filteredQuery = generateDateFilterQuery(
      filterType,
      startDate,
      endDate
    );

    const reports = await Order.find(filteredQuery)
      .populate("user")
      .populate("shippingAddress")
      .populate("orderItems.product")
      .sort({ placedAt: -1 });

    const PDFDOC = new PDFDocument({ margin: 50, size: "A4" });
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales_report.pdf"
    );

    PDFDOC.pipe(res);

    PDFDOC.on("pageAdded", () => {
      PDFDOC.rect(0, 0, PDFDOC.page.width, PDFDOC.page.height)
        .fillColor("white")
        .fill()
        .fillColor("black");
    });

    PDFDOC.rect(0, 0, PDFDOC.page.width, PDFDOC.page.height)
      .fillColor("white")
      .fill()
      .fillColor("black");

    PDFDOC.fontSize(20).text("Sales Report", { align: "center" }).moveDown(2);

    for (let index = 0; index < reports.length; index++) {
      const report = reports[index];

      if (PDFDOC.y + 100 > PDFDOC.page.height) {
        PDFDOC.addPage();
      }
      PDFDOC.fontSize(14).font("Helvetica-Bold");
      PDFDOC.text(`Order ${index + 1}:`).moveDown(0.5);

      PDFDOC.fontSize(10).font("Helvetica");
      PDFDOC.text(
        `Order Date: ${new Date(report.placedAt).toLocaleDateString()}`
      );
      PDFDOC.text(`Customer Name: ${report.user.name}`);
      PDFDOC.text(`Payment Method: ${report.paymentMethod}`);
      PDFDOC.text(`Delivery Status: ${"Delivered"}`).moveDown(0.5);
      const table = {
        title: "Product Details",
        headers: [
          "Product Name",
          "Quantity",
          "Unit Price (RS)",
          "Total Price (RS)",
          "Discount (RS)",
          "Coupon (RS)",
        ],
        rows: report.orderItems.map((item) => [
          item.product.name,
          item.qty.toString(),
          (Number(item.price) || 0).toFixed(2),
          (Number(item.totalPrice) || 0).toFixed(2),
          (Number(report.totalDiscount) || 0).toFixed(2),
          (Number(report.couponDiscount)) === 0 ? `(Not Applied)`: (Number(report.couponDiscount)).toFixed(2)  ,
        ]),
      };

      if (PDFDOC.y + 150 > PDFDOC.page.height) {
        PDFDOC.addPage();
      }

      try {
        await PDFDOC.table(table, {
          prepareHeader: () => PDFDOC.font("Helvetica-Bold").fontSize(8),
          prepareRow: (row, i) => PDFDOC.font("Helvetica").fontSize(8),
          width: 500,
          columnsSize: [140, 50, 70, 70, 70, 70],
          padding: 5,
        });
      } catch (error) {
        console.error("Error generating table:", error);
      }
      PDFDOC.moveDown(0.5);
      PDFDOC.font("Helvetica-Bold")
        .fontSize(10)
        .text(`Final Amount: RS. ${report.total_price_with_discount}`);
      PDFDOC.moveDown();
    }

    PDFDOC.end();
  } catch (err) {
    console.log(err);
    res.status(500).send("Error generating sales report PDF");
  }
};

async function downloadSalesExcel(req, res) {
  try {
    const { filterType, startDate, endDate } = req.query;
    const filteredQuery = generateDateFilterQuery(
      filterType,
      startDate,
      endDate
    );

    const reports = await Order.find(filteredQuery)
      .populate("user")
      .populate("shippingAddress")
      .populate("orderItems.product")
      .sort({ placed_at: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    worksheet.columns = [
      { header: "Order Date", key: "orderDate", width: 20 },
      { header: "Customer Name", key: "customerName", width: 20 },
      { header: "Payment Method", key: "paymentMethod", width: 20 },
      { header: "Order Status", key: "orderStatus", width: 20 },
      { header: "Product Name", key: "productName", width: 25 },
      { header: "Quantity", key: "quantity", width: 10 },
      { header: "Unit Price (RS)", key: "unitPrice", width: 15 },
      { header: "Discount (RS)", key: "discount", width: 15 },
      { header: "Coupon (RS)", key: "couponDeduction", width: 15 },
      { header: "Final Amount (RS)", key: "finalAmount", width: 15 },
    ];

    reports.forEach((report) => {
      const orderDate = new Date(report.placedAt).toLocaleDateString();
      const products = report.orderItems.map((item) => ({
        orderDate,
        customerName: report.user.name,
        paymentMethod: report.paymentMethod,
        orderStatus: item.orderStatus,
        productName: item.product.name,
        quantity: item.qty,
        unitPrice: item.price || 0,
        totalPrice: item.totalProductPrice || 0, 
        discount: report.totalDiscount || 0,
        couponDeduction: report.couponDiscount || 0,
        finalAmount: report.total_price_with_discount || 0,
      }));

      // Add each product as a row
      products.forEach((product) => worksheet.addRow(product));
    });

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=SalesReport.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Error generating Excel report:", err);
    res.status(500).send("Error generating sales report Excel");
  }
}

module.exports = {
  fetchSalesReport,
  downloadSalesExcel,
  downloadSalesPDF,
};
