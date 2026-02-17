# ElectroChem Plotter 🧪📈

A professional-grade, browser-based visualization tool for Electrochemical data. Specifically designed for **Cyclic Voltammetry (CV)**, this application allows researchers to upload raw data, overlay multiple scans, customize plot aesthetics, and export publication-ready figures.

## ✨ Key Features

- **Multi-Tab Interface**: Organize different experiments or projects within a single session.
- **Advanced Overlay**: Compare multiple `.txt` files in a single chart with ease.
- **Interactive Visualization**:
  - **Box Zoom**: Shift + Drag to zoom into specific regions.
  - **Wheel Zoom**: Smooth scrolling to inspect peaks.
  - **Panning**: Navigate through your data seamlessly.
- **Publication-Ready Styling**:
  - Customize colors, line widths, and point shapes (Cross, Diamond, Square, etc.).
  - Real-time **Smoothing** (Moving Average) to clean up noisy data.
  - Full control over axis labels, font sizes, and tick intervals.
- **High-Quality Export**: Download charts as high-resolution PNGs with automatically generated legends.
- **Zero-Server Architecture**: All data processing happens locally in your browser. Your data never leaves your computer.

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge).
- Raw data in `.txt` format (tab-separated or space-separated).

### Quick Start

1.  **Open the App**: Launch the application in your browser.
2.  **Upload Data**: Drag and drop a `.txt` file into the upload zone or use the "Upload" button in the sidebar.
3.  **Explore**: Use the **Graph Properties** sidebar on the right to tweak colors, change units (A, mA, µA), or apply smoothing.
4.  **Export**: Click the download icon in the left sidebar to save your figure.

## 🛠 Technical Stack

- **React 19**: Modern UI component architecture.
- **Recharts**: High-performance SVG charting library.
- **Tailwind CSS**: Utility-first styling for a clean, responsive interface.
- **html2canvas**: Client-side image generation for high-res exports.
- **TypeScript**: Robust type-checking for data integrity.

## 📄 File Format Support

The plotter expects a `.txt` file where:
- The first column is **Potential (V)**.
- The second column is **Current (A)**.
- Lines starting with `#` are treated as comments.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support & Feedback

If you encounter any issues or have suggestions for new features, please use the "Provide Feedback" tool within the app or reach out via GitHub Issues.

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Author
Inigo Antony

---

*Developed for the Electrochemistry community.*
