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
  } else if (filterType === "monthly") {
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

const fetchSalesReport = async (req, res) => {
  try {
    const { page = 0, limit = 15, filterType, startDate, endDate } = req.query;

    const skip = page * limit;
    // const query = {}; // your base query
     const finalQuery = generateDateFilterQuery(filterType, startDate, endDate);

    const orders = await Order.find(finalQuery)
      .populate("user")
      .populate("shippingAddress")
      .populate("orderItems.product")
      .sort({ placedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Filter only Delivered order items per order
    const filteredOrders = orders
      .map((order) => {
        const deliveredItems = order.orderItems.filter(
          (item) => item.orderStatus === "Delivered"
        );
        if (deliveredItems.length === 0) return null;

        return {
          ...order.toObject(),
          orderItems: deliveredItems,
        };
      })
      .filter((order) => order !== null);

    // Calculate total sales from filtered data
    const totalSales = filteredOrders.reduce((acc, order) => {
      return (
        acc +
        order.orderItems.reduce(
          (itemTotal, item) => itemTotal + item.price * item.qty,
          0
        )
      );
    }, 0);

    // For pagination, calculate total count of filtered orders
    const totalCount = await Order.countDocuments(finalQuery);
    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      orders: filteredOrders,
      totalSales,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error("Error in fetchSalesReport:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const downloadSalesPDF = async (req, res) => {
  try {
    const { filterType, startDate, endDate } = req.query;
    const filteredQuery = generateDateFilterQuery(filterType, startDate, endDate);

    const reports = await Order.find(filteredQuery)
      .populate("user")
      .populate("shippingAddress")
      .populate("orderItems.product")
      .sort({ placedAt: -1 });

    const PDFDOC = new PDFDocument({ margin: 50, size: "A4" });

    res.setHeader("Content-Disposition", "attachment; filename=sales_report.pdf");
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

      // Calculate coupon share for each product
      const totalOrderAmount = report.totalAmount || 0;
      const totalCouponDiscount = report.couponDiscount || 0;

      report.orderItems.forEach((item) => {
        const priceShare = (item.totalPrice || 0) / totalOrderAmount;
        item._couponShare = parseFloat((priceShare * totalCouponDiscount).toFixed(2));
      });

      // Filter only delivered items for PDF display
      const deliveredItems = report.orderItems.filter(
        (item) => item.orderStatus === "Delivered"
      );
      if (deliveredItems.length === 0) continue;

      if (PDFDOC.y + 100 > PDFDOC.page.height) PDFDOC.addPage();

      PDFDOC.fontSize(14).font("Helvetica-Bold");
      PDFDOC.text(`Order ${index + 1}:`).moveDown(0.5);

      PDFDOC.fontSize(10).font("Helvetica");
      PDFDOC.text(`Order Date: ${new Date(report.placedAt).toLocaleDateString()}`);
      PDFDOC.text(`Customer Name: ${report.user.name}`);
      PDFDOC.text(`Payment Method: ${report.paymentMethod}`);
      PDFDOC.text(`Delivery Status: Delivered`).moveDown(0.5);

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
        rows: deliveredItems.map((item) => [
          item.product.name,
          item.qty.toString(),
          (Number(item.price) || 0).toFixed(2),
          (Number(item.totalPrice) || 0).toFixed(2),
          (Number(item.discount) || 0).toFixed(2),
          Number(item._couponShare) === 0
            ? `(Not Applied)`
            : Number(item._couponShare).toFixed(2),
        ]),
      };

      if (PDFDOC.y + 150 > PDFDOC.page.height) PDFDOC.addPage();

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

      // Calculate final delivered-only total
      const deliveredTotal = deliveredItems.reduce((acc, item) => acc + item.totalPrice, 0);
      const deliveredDiscount = deliveredItems.reduce((acc, item) => acc + item.discount, 0);
      const deliveredCoupon = deliveredItems.reduce((acc, item) => acc + item._couponShare, 0);
      const finalDeliveredAmount = deliveredTotal - deliveredDiscount - deliveredCoupon;

      PDFDOC.moveDown(0.5);
      PDFDOC.font("Helvetica-Bold")
        .fontSize(10)
        .text(`Final Amount (Delivered): RS. ${finalDeliveredAmount.toFixed(2)}`);
      PDFDOC.moveDown();
    }

    PDFDOC.end();
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating sales report PDF");
  }
};

async function downloadSalesExcel(req, res) {
  try {
    const { filterType, startDate, endDate } = req.query;
    const filteredQuery = generateDateFilterQuery(filterType, startDate, endDate);

    const reports = await Order.find(filteredQuery)
      .populate("user")
      .populate("shippingAddress")
      .populate("orderItems.product")
      .sort({ placedAt: -1 });

    const filteredReports = reports
      .map((order) => {
        const deliveredItems = order.orderItems.filter(
          (item) => item.orderStatus === "Delivered"
        );
        if (deliveredItems.length === 0) return null;

        return {
          ...order.toObject(),
          orderItems: deliveredItems,
          allItems: order.orderItems, // include all for total price
          couponDiscount: order.couponDiscount || 0,
        };
      })
      .filter((order) => order !== null);

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
      { header: "Final Amount (RS)", key: "finalAmount", width: 18 },
    ];

    filteredReports.forEach((report) => {
      const orderDate = new Date(report.placedAt).toLocaleDateString();

      // 🔴 Step 1: Calculate total of all items (delivered + cancelled + returned)
      const fullOrderTotal = report.allItems.reduce(
        (sum, item) => sum + item.price * item.qty,
        0
      );

      report.orderItems.forEach((item) => {
        const itemAmount = item.price * item.qty;

        // 🔴 Step 2: Calculate this item's share of total coupon discount
        const priceShare = fullOrderTotal ? itemAmount / fullOrderTotal : 0;
        const couponShare = parseFloat((priceShare * report.couponDiscount).toFixed(2));

        const finalAmount = itemAmount - (item.discount || 0) - couponShare;

        worksheet.addRow({
          orderDate,
          customerName: report.user.name,
          paymentMethod: report.paymentMethod,
          orderStatus: item.orderStatus,
          productName: item.product.name,
          quantity: item.qty,
          unitPrice: item.price || 0,
          discount: item.discount || 0,
          couponDeduction: couponShare,
          finalAmount: finalAmount.toFixed(2),
        });
      });
    });

    res.setHeader("Content-Disposition", "attachment; filename=SalesReport.xlsx");
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
