// import componente
import ButtonGroup from "./components/ButtonGroup";
import Alert from "./components/Alert";
import Dropzone from "./components/Dropzone";
import Form from "./components/Form";
import Stiri from "./components/Stiri";

// grafica generala
import "./App.css";

// import extern
import { useState, useEffect, useRef } from "react";
import { Chart as ChartJS } from "chart.js/auto";

import { Line, Bar } from "react-chartjs-2";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// referinta data
let dateNow = new Date();

// referinta server
const path = "localhost";

// grafica pentru line charts
const propGrafica = (
  titleStat: string,
  timePeriod: string,
  targetValue?: number,
  isQuarterly: boolean = false
) => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: !isQuarterly,
        title: {
          display: true,
          text: titleStat,
          color: "#ba8bd3",
        },
        ticks: {
          color: "#ba8bd3",
        },
        grid: {
          color: "#ba8bd3",
        },
      },
      x: {
        title: {
          display: true,
          text: isQuarterly
            ? `Săptămânile trimestrului ${timePeriod}`
            : `Zilele lunii ${timePeriod}`,
          color: "#ba8bd3",
        },
        ticks: {
          color: "#ba8bd3",
        },
        grid: {
          color: "#ba8bd3",
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: "#ba8bd3",
          font: {
            size: 14,
            weight: "bold",
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
  };
};

// limitari in functie de rol
const geStatsByRole: Record<string, string[]> = {
  "Process Engineer": [
    "GE",
    "Production hours",
    "Minor Stoppages",
    "Breakdowns",
    "Quality Loss",
  ],
};

// props pentru alegerea lunii
interface MonthlyDataEntry {
  date: string | number;
  operatie: string;
  valoare: string;
}

// props pentru json target
interface Target {
  operation: string;
  target: number;
}

function App() {
  // new
  // Add these state variables
  const [showDateInput, setShowDateInput] = useState(false);
  const [comparisonDates, setComparisonDates] = useState<string[]>([]);
  const [comparisonCardsData, setComparisonCardsData] = useState<
    Record<string, any[]>
  >({});

  // useState-urile pentru a evidentia sau ignora elemente
  const [loading, setLoading] = useState(false);
  const [cardsData, setCardsData] = useState<any[]>([]);
  const [alertVisible, setAlertVisiblity] = useState(false);

  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [selectedInitial, setSelectedInitial] = useState<string | null>(null);
  const [selectedGraph, setSelectedGraph] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedLogViewer, setSelectedLogViewer] = useState<string | null>(
    null
  );
  const [logViewerData, setLogViewerData] = useState<any[]>([]);
  const [selectedLogDate, setSelectedLogDate] = useState<string | null>(null);
  const [showLogDateForm, setShowLogDateForm] = useState(false);

  const [selectedHeader, setSelectedHeader] = useState<string | null>(null);
  const [headerPopupData, setHeaderPopupData] = useState<any[]>([]);
  const [ignoreH4, setIgnoreH4] = useState(false);
  const [showHeaderPopup, setShowHeaderPopup] = useState(false);
  const [showBOSTable, setShowBOSTable] = useState(false);

  const [selectedDMSActionTable, setSelectedDMSActionTable] = useState<
    string | null
  >(null);
  const [dmsActionData, setDmsActionData] = useState<any[]>([]);
  const [dmsFilter, setDmsFilter] = useState({ status: "active" }); // Default filter

  // useState pentru fiecare graph + target, bos
  const [chartDataGE, setChartDataGE] = useState<any>(null);
  const [chartDataVolume, setChartDataVolume] = useState<any>(null);
  const [chartDataWaste, setChartDataWaste] = useState<any>(null);
  const [chartDataSpeed, setChartDataSpeed] = useState<any>(null);
  const [bosData, setBosData] = useState<any[]>([]);
  const [nmData, setNmData] = useState<any[]>([]);
  const [productionPlanData, setProductionPlanData] = useState<any[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);

  // useState pentru ignorare
  const [notIgnore, setNotIgnore] = useState(false);

  // useState pentru popUp uri
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [showAddActionPopup, setShowAddActionPopup] = useState(false);

  // useState raport nou
  const [newRaport, setNewRaport] = useState({
    tip: "",
    tipSecundar: "",
    oraIn: "",
    oraOut: "",
    zona: "",
    masina: "",
    ansamblu: "",
    problema: "",
  });

  // useState pentru date
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [showDateForm, setShowDateForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [showMonthForm, setShowMonthForm] = useState(false);
  const [selectedMonthInput, setSelectedMonthInput] = useState(
    new Date().toISOString().slice(0, 7)
  );

  // useState pentru selectie masini
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  const [selectedMachineMonth, setSelectedMachineMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // Default to current month YYYY-MM
  );
  const [showMachineMonthForm, setShowMachineMonthForm] = useState(false);
  const [chartDataMachine, setChartDataMachine] = useState<any>(null);

  // useState browser
  const [currentPath, setCurrentPath] = useState<string>("");

  // functie de extragere timp
  function extractHourMinute(dateTimeString: string): string {
    try {
      // Parse the date string
      const date = new Date(dateTimeString);

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date string");
      }

      // Extract hours and minutes
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");

      // Return formatted time
      return `${hours}:${minutes}`;
    } catch (error) {
      console.error("Error parsing date:", error);
      return "00:00"; // Default fallback
    }
  }

  // contor backend, printare
  const first = useRef(false);
  const printRef = useRef(null);

  // breadcrumbs logic
  const Breadcrumbs = () => {
    const breadcrumbItems = [];

    // Home is always first
    if (selectedInitial) {
      breadcrumbItems.push(
        <span
          onClick={() => {
            setSelectedInitial(null);
            setSelectedPosition(null);
            setSelectedDataset(null);
            setSelectedGraph(null);
            setSelectedTime(null);
            setSelectedQuarter(null);
            setShowDateForm(false);
            setShowMonthForm(false);
            setSelectedMonth(null);
          }}
          className="text-breadcrumb hover:text-[#2E4053]"
        >
          Home
        </span>
      );
    }

    if (selectedPosition) {
      breadcrumbItems.push(<> • </>);
      breadcrumbItems.push(
        <span
          onClick={handleBackToPositions}
          className="text-breadcrumb hover:text-[#2E4053]"
        >
          Positions
        </span>
      );
    }

    if (selectedDataset) {
      breadcrumbItems.push(<> • </>);
      breadcrumbItems.push(
        <span
          onClick={handleBackToDatasets}
          className="text-breadcrumb hover:text-[#2E4053]"
        >
          Datasets
        </span>
      );
    }
    if (selectedTime || selectedMonth) {
      breadcrumbItems.push(<> • </>);
      breadcrumbItems.push(
        <span
          onClick={() => {
            setSelectedGraph(null);
            setSelectedMonth(null);
            setSelectedTime(null);
            setSelectedMachine(null);
            setSelectedMachineMonth(new Date().toISOString().slice(0, 7));
          }}
          className="text-breadcrumb hover:text-[#2E4053]"
        >
          Graph Type
        </span>
      );
    }
    if (selectedDMSActionTable) {
      breadcrumbItems.push(<> • </>);
      breadcrumbItems.push(
        <span
          onClick={() => {
            setSelectedDMSActionTable(null);
            setDmsActionData([]);
            setDmsFilter({ status: "active" });
          }}
          className="text-breadcrumb hover:text-[#2E4053]"
        >
          DMS Action Table
        </span>
      );
    }

    if (selectedGraph) {
      breadcrumbItems.push(<> • </>);
      breadcrumbItems.push(
        <span
          onClick={() => {
            setSelectedGraph(null);
          }}
          className="text-breadcrumb hover:text-[#2E4053]"
        >
          KPIs
        </span>
      );
    }
    if (selectedInitial) {
      return <div className="breadcrumbs-container ">{breadcrumbItems}</div>;
    } else return null;
  };

  // popUp uri
  // functie popup filtre, dms action table
  const FilterPopup = () => {
    const [filterValues, setFilterValues] = useState({
      location: dmsFilter.location || "",
      action: dmsFilter.action || "",
      responsibleTeam: dmsFilter.responsibleTeam || "",
      dueDate: dmsFilter.dueDate || "",
      status: dmsFilter.status || "active",
    });

    const handleApplyFilters = async () => {
      // Remove empty filters
      const activeFilters = Object.fromEntries(
        Object.entries(filterValues).filter(([_, value]) => value !== "")
      );

      setDmsFilter(activeFilters);
      await fetchDMSActionData(activeFilters);
      setShowFilterPopup(false);
    };

    const handleClearFilters = async () => {
      setFilterValues({
        location: "",
        action: "",
        responsibleTeam: "",
        dueDate: "",
        status: "active",
      });
      const defaultFilters = { status: "active" };
      setDmsFilter(defaultFilters);
      await fetchDMSActionData(defaultFilters);
      setShowFilterPopup(false);
    };

    if (!showFilterPopup) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowFilterPopup(false)}>
        <div
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: "500px" }}
        >
          <div className="modal-header">
            <h3>Select Filtering</h3>
            <button
              className="close-button"
              onClick={() => setShowFilterPopup(false)}
            >
              ×
            </button>
          </div>

          <div
            className="modal-body"
            style={{
              display: "flex",
              justifyContent: "center",
              alignContent: "center",
            }}
          >
            <div className="filter-form">
              <div className="filter-row">
                <label>Location:</label>
                <select
                  value={filterValues.location}
                  onChange={(e) =>
                    setFilterValues({
                      ...filterValues,
                      location: e.target.value,
                    })
                  }
                  className="form-select"
                >
                  <option value="">All Locations</option>
                  <option value="L1">L1</option>
                  <option value="L2">L2</option>
                  <option value="L3">L3</option>
                </select>
              </div>

              <div className="filter-row">
                <input
                  type="text"
                  value={filterValues.action}
                  onChange={(e) =>
                    setFilterValues({ ...filterValues, action: e.target.value })
                  }
                  placeholder="Filter by action..."
                  className="form-control"
                />
              </div>

              <div className="filter-row">
                <input
                  type="text"
                  value={filterValues.responsibleTeam}
                  onChange={(e) =>
                    setFilterValues({
                      ...filterValues,
                      responsibleTeam: e.target.value,
                    })
                  }
                  placeholder="Filter by team..."
                  className="form-control"
                />
              </div>

              <div className="filter-row">
                <label>Due Date:</label>
                <input
                  type="date"
                  value={filterValues.dueDate}
                  onChange={(e) =>
                    setFilterValues({
                      ...filterValues,
                      dueDate: e.target.value,
                    })
                  }
                  className="form-control"
                />
              </div>

              <div className="filter-row">
                <label>Status:</label>
                <select
                  value={filterValues.status}
                  onChange={(e) =>
                    setFilterValues({ ...filterValues, status: e.target.value })
                  }
                  className="form-select"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          <div
            className="modal-footer"
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <button className="btn btn-primary" onClick={handleClearFilters}>
              Clear All
            </button>
            <button className="btn btn-primary" onClick={handleApplyFilters}>
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    );
  };

  // functie popup adaugare, dms action table
  const AddActionPopup = () => {
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 7);
    const defaultDueDateString = defaultDueDate.toISOString().split("T")[0];

    const [newAction, setNewAction] = useState({
      location: "",
      action: "",
      responsibleTeam: "",
      dueDate: defaultDueDateString,
      status: "active",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddAction = async () => {
      if (
        !newAction.action ||
        !newAction.responsibleTeam ||
        !newAction.dueDate
      ) {
        alert(
          "Please fill in all required fields: Action, Responsible Team, and Due Date"
        );
        return;
      }

      setIsSubmitting(true);
      try {
        // Call the backend to add the action
        await handleAddDMSAction(newAction);

        // Close popup on success
        setShowAddActionPopup(false);

        // Reset form
        setNewAction({
          location: "",
          action: "",
          responsibleTeam: "",
          dueDate: defaultDueDateString,
          status: "active",
        });
      } catch (error) {
        console.error("Failed to add action:", error);
        alert("Failed to add action. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleCancel = () => {
      setShowAddActionPopup(false);
      // Reset form
      setNewAction({
        location: "",
        action: "",
        responsibleTeam: "",
        dueDate: defaultDueDateString,
        status: "active",
      });
    };

    if (!showAddActionPopup) return null;

    return (
      <div className="modal-overlay" onClick={handleCancel}>
        <div
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: "500px" }}
        >
          <div className="modal-header">
            <h3>Add New Action</h3>
            <button className="close-button" onClick={handleCancel}>
              ×
            </button>
          </div>

          <div className="modal-body">
            <div className="filter-form">
              <div className="filter-row">
                <label>Location:</label>
                <select
                  value={newAction.location}
                  onChange={(e) =>
                    setNewAction({ ...newAction, location: e.target.value })
                  }
                  className="form-select"
                >
                  <option value="">All Locations</option>
                  <option value="L1">L1</option>
                  <option value="L2">L2</option>
                  <option value="L3">L3</option>
                </select>
              </div>

              <div className="filter-row">
                <input
                  type="text"
                  value={newAction.action}
                  onChange={(e) =>
                    setNewAction({ ...newAction, action: e.target.value })
                  }
                  placeholder="Enter action description..."
                  className="form-control"
                />
              </div>

              <div className="filter-row">
                <input
                  type="text"
                  value={newAction.responsibleTeam}
                  onChange={(e) =>
                    setNewAction({
                      ...newAction,
                      responsibleTeam: e.target.value,
                    })
                  }
                  placeholder="Enter responsible team..."
                  className="form-control"
                />
              </div>

              <div className="filter-row">
                <label>Due Date:</label>
                <input
                  type="date"
                  value={newAction.dueDate}
                  onChange={(e) =>
                    setNewAction({ ...newAction, dueDate: e.target.value })
                  }
                  className="form-control"
                />
              </div>

              <div className="filter-row">
                <label>Status:</label>
                <select
                  value={newAction.status}
                  onChange={(e) =>
                    setNewAction({ ...newAction, status: e.target.value })
                  }
                  className="form-select"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          <div
            className="modal-footer"
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <button
              className="btn btn-primary"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAddAction}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Action"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // functie popup details log viewer
  const HeaderDetailsPopup = () => {
    if (!showHeaderPopup) return null;

    const handleCommentClick = async (index: number) => {
      if (!selectedHeader || !selectedLogDate) return;

      const currentComment = headerPopupData[index]?.rawData?.comentariu || "";

      if (!currentComment || currentComment === "No comments") {
        // Add new comment
        const comment = prompt("Add comments");
        if (comment !== null && comment.trim() !== "") {
          await saveComment(index, comment);
        }
      } else {
        const confirmDelete = window.confirm(
          "Are you sure to delete this comment?"
        );
        if (confirmDelete) {
          await saveComment(index, "");
        }
      }
    };

    const saveComment = async (index: number, comment: string) => {
      try {
        // Update local state
        setHeaderPopupData((prev) =>
          prev.map((card, i) =>
            i === index
              ? {
                  ...card,
                  rawData: {
                    ...card.rawData,
                    comentariu: comment,
                  },
                }
              : card
          )
        );

        // Save to backend
        const dateFormatted = new Date(selectedLogDate!)
          .toISOString()
          .slice(0, 10)
          .replace(/-/g, "");

        const response = await fetch(
          `http://${path}:5000/update-header-comment`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date: dateFormatted,
              headerType: selectedHeader?.toLowerCase().replace(" ", "_"),
              equipmentIndex: index,
              comment: comment,
            }),
          }
        );

        if (!response.ok) throw new Error("Eroare la salvarea comentariului");

        console.log("Comentariu salvat cu succes");
      } catch (err) {
        console.error("Error saving comment:", err);
        alert("The comment couldn't be saved.");

        // Revert local state on error
        setHeaderPopupData((prev) =>
          prev.map((card, i) =>
            i === index
              ? {
                  ...card,
                  rawData: {
                    ...card.rawData,
                    comentariu:
                      headerPopupData[index]?.rawData?.comentariu || "",
                  },
                }
              : card
          )
        );
      }
    };

    return (
      <div className="modal-overlay" onClick={() => setShowHeaderPopup(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>
              Detalii {selectedHeader} - {selectedLogDate}
            </h3>
            <button
              className="close-button"
              onClick={() => setShowHeaderPopup(false)}
            >
              ×
            </button>
          </div>

          <div className="modal-body">
            {loading ? (
              <div className="loading-container">
                <p>Data loading...</p>
              </div>
            ) : headerPopupData.length > 0 ? (
              <div className="modal-table-container" id="pdf-container">
                {ignoreH4 && (
                  <h4>
                    {"Detalii   "}
                    {selectedHeader}
                    {"   -   "}
                    {selectedLogDate}
                  </h4>
                )}
                <table className="modal-table">
                  <thead>
                    <tr>
                      <th>Equipment</th>
                      <th>Change</th>
                      <th>Product</th>
                      <th>Time</th>
                      <th>Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {headerPopupData.map((card, index) => (
                      <tr key={index} className="modal-table-row">
                        <td>{card.header}</td>
                        <td>{card.rawData?.schimb || "-"}</td>
                        <td>{card.rawData?.produs || "-"}</td>
                        <td>{card.rawData?.minute || "0"}</td>
                        <td
                          className="comment-cell clickable-comment"
                          onClick={() => handleCommentClick(index)}
                          style={{
                            cursor: "pointer",
                            color:
                              !card.rawData?.comentariu ||
                              card.rawData?.comentariu === "No comments"
                                ? "#6c757d"
                                : "#3b165a",
                            fontStyle:
                              !card.rawData?.comentariu ||
                              card.rawData?.comentariu === "No comments"
                                ? "italic"
                                : "normal",
                            minWidth: "150px",
                          }}
                          title="Click for adding/modifing/dele"
                        >
                          {card.rawData?.comentariu || "No comments"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-data-container">
                <p>
                  No available info for {selectedHeader} for the selected date.
                </p>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              className="btn btn-primary"
              onClick={handleExportToPDF}
              disabled={headerPopupData.length === 0}
            >
              📄 PDF Export
            </button>
          </div>
        </div>
      </div>
    );
  };

  // fetch uri
  // fetch general backend
  const firstFetch = async () => {
    try {
      // apel backend efectiv
      const res = await fetch(`http://${path}:5000/run-script`);
      if (!res.ok) throw new Error("Eroare la rularea scriptului");
      const data = await res.json();
      console.log("Rezultat script", data);
    } catch (err) {
      console.error("Eroare:", err);
    }
  };

  // fetch handle header pentru log viewer details
  const handleHeaderClick = async (header: string, date: string) => {
    const validHeaders = [
      "Breakdowns",
      "Minor Stoppages",
      "Operational Losses",
    ];

    if (!validHeaders.includes(header)) {
      return;
    }

    setSelectedHeader(header);
    setLoading(true);

    try {
      const dateObj = new Date(date);
      const dateFormatted = dateObj
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "");

      const response = await fetch(`http://${path}:5000/data/${dateFormatted}`);

      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.status}`);
      }

      const data = await response.json();
      const dateData = data.data;
      var key = header.toLowerCase();
      if (key === "minor stoppages") {
        key = "minor_stoppages";
      } else if (key === "operational losses") {
        key = "operational_losses";
      }
      const section = dateData[key] || [];

      const cardData = section.map((entry: any, index: number) => ({
        header: entry.nume_echipament || `${header} - Entry ${index + 1}`,
        text: `Change: ${entry.schimb}\nProduct: ${entry.produs}\nTime: ${
          entry.minute
        }${entry.comentariu ? `\nComments: ${entry.comentariu}` : ""}`,
        rawData: entry, // Keep the raw data for table display
      }));

      setHeaderPopupData(cardData);
      setShowHeaderPopup(true);
    } catch (err) {
      console.error("Error fetching header details:", err);
      setAlertVisiblity(true);
    } finally {
      setLoading(false);
    }
  };

  // fetch date pentru dms table
  const fetchDMSActionData = async (filters: any = {}) => {
    setLoading(true);
    try {
      const response = await fetch(`http://${path}:5000/dms-actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters }),
      });

      if (!response.ok) throw new Error("Eroare la descărcarea datelor DMS");

      const data = await response.json();
      setDmsActionData(data.data || []);
    } catch (err) {
      console.error(err);
      setAlertVisiblity(true);
    } finally {
      setLoading(false);
    }
  };

  // fetch data log viewer
  const fetchSectionManagerProductionData = async (date: string) => {
    setLoading(true);

    try {
      // Format date to YYYYMMDD format expected by backend
      const dateObj = new Date(date);
      const dateFormatted = dateObj
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "");

      console.log("Fetching data for date:", dateFormatted); // Debug log

      const response = await fetch(
        `http://${path}:5000/section-manager-production/${dateFormatted}`
      );

      if (!response.ok) {
        throw new Error(
          `Eroare la descărcarea datelor de producție: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Server response:", data); // Debug log

      // Handle case where no data is found (404 with empty array)
      if (data.status === "error" || !data.data || data.data.length === 0) {
        console.log("No data found for date:", dateFormatted);
        setLogViewerData([]);
        return;
      }

      const productionData = data.data;
      console.log("Production data received:", productionData); // Debug log

      // Format the data for table display
      const formattedData = productionData.map((entry: any, index: number) => ({
        header: `Entry ${index + 1}`,
        text: formatProductionDataForTable(entry),
      }));

      setLogViewerData(formattedData);
    } catch (err) {
      console.error("Fetch error:", err);
      setAlertVisiblity(true);
      setLogViewerData([]);
    } finally {
      setLoading(false);
    }
  };

  // fetch data din excel productie
  const fetchProductionPlanData = async (selectedDate) => {
    setLoading(true);
    try {
      const today = new Date(selectedDate);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const todayFormatted = Form(today);
      const yesterdayFormatted = Form(yesterday);

      const [todayResponse, yesterdayResponse] = await Promise.all([
        fetch(`http://${path}:5000/data/${todayFormatted}`),
        fetch(`http://${path}:5000/data/${yesterdayFormatted}`),
      ]);

      if (!todayResponse.ok && !yesterdayResponse.ok) {
        throw new Error("Eroare la descărcarea fișierului");
      }

      const cards = [];

      // Process today's data if available
      if (todayResponse.ok) {
        const todayData = await todayResponse.json();
        const dateData = todayData.data;
        const productionPlan = dateData.production_plan || [];

        // Take only today's entries (limit to 3 based on current time if needed)
        productionPlan.forEach((entry: any) => {
          const cardData = {
            header: entry.tip_produs || "Production Entry",
            text: `Start Date: ${entry.start_date || ""}\nEnd Date: ${
              entry.end_date || ""
            }\nProduct Type: ${entry.tip_produs || ""}\nGramaj: ${
              entry.gramaj || ""
            }\nPcs/Bax: ${entry.pcs_bax || ""}\nComanda Initiala: ${
              entry.comanda_initiala || ""
            }\nShifturi: ${entry.shifturi || ""}\nOre Productie: ${
              entry.ore_productie || ""
            }`,
            isYesterday: false,
          };
          cards.push(cardData);
        });
      }

      // Process yesterday's data - ONLY last row if it spans into today
      if (yesterdayResponse.ok) {
        const yesterdayData = await yesterdayResponse.json();
        const dateData = yesterdayData.data;
        const productionPlan = dateData.production_plan || [];

        if (productionPlan.length > 0) {
          const lastEntry = productionPlan[productionPlan.length - 1];

          // Check if this entry spans from yesterday to today
          if (lastEntry.start_date && lastEntry.end_date) {
            const startDate = new Date(lastEntry.start_date);
            const endDate = new Date(lastEntry.end_date);
            const isOvernight =
              startDate.getDate() === yesterday.getDate() &&
              endDate.getDate() === today.getDate();

            if (isOvernight) {
              const cardData = {
                header: lastEntry.tip_produs || "Production Entry",
                text: `Start Date: ${lastEntry.start_date || ""}\nEnd Date: ${
                  lastEntry.end_date || ""
                }\nProduct Type: ${lastEntry.tip_produs || ""}\nGramaj: ${
                  lastEntry.gramaj || ""
                }\nPcs/Bax: ${lastEntry.pcs_bax || ""}\nComanda Initiala: ${
                  lastEntry.comanda_initiala || ""
                }\nShifturi: ${lastEntry.shifturi || ""}\nOre Productie: ${
                  lastEntry.ore_productie || ""
                }`,
                isYesterday: true,
              };
              cards.push(cardData);
            }
          }
        }
      }

      console.log("All cards:", cards);
      setProductionPlanData(cards);
    } catch (err) {
      console.error(err);
      setAlertVisiblity(true);
    } finally {
      setLoading(false);
    }
  };

  // fetch data din json bos
  const fetchBOSData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://${path}:5000/bos-data/`);
      if (!response.ok) throw new Error("Eroare la descărcarea datelor BOS");

      const data = await response.json();
      const bosData = data.data;

      // Create cards in the format expected by your renderBOSTable function
      const cards = [
        {
          header: "Date BOS",
          text: `Actiune Sigura: ${
            bosData.actiuni_sigure || 0
          }\nActiune Nesigura: ${bosData.actiuni_nesigure || 0}`,
        },
      ];

      setBosData(cards);
    } catch (err) {
      console.error(err);
      setAlertVisiblity(true);
    } finally {
      setLoading(false);
    }
  };

  // fetch data din json nm
  const fetchNMData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://${path}:5000/nm-data/`);
      if (!response.ok) throw new Error("Eroare la descărcarea datelor NM");

      const data = await response.json();
      const nmData = data.data;

      // Create cards in the format expected by your renderBOSTable function
      const cards = [
        {
          header: "Date BOS",
          text: `Near Miss: ${nmData.near_miss || 0}\nConditii Nesigure: ${
            nmData.unsafe_conditions || 0
          }`,
        },
      ];

      setNmData(cards);
    } catch (err) {
      console.error(err);
      setAlertVisiblity(true);
    } finally {
      setLoading(false);
    }
  };

  // fetch date saptamanale
  const fetchWeeklyData = async (quarter: string, graphType: string) => {
    setLoading(true);
    try {
      const response = await fetch("./data/weekly_summary.json");
      if (!response.ok)
        throw new Error("Eroare la descărcarea datelor săptămânale");

      const weeklyData = await response.json();

      // Determine quarter range
      const quarterRanges: { [key: string]: { start: number; end: number } } = {
        Q1: { start: 1, end: 13 },
        Q2: { start: 14, end: 26 },
        Q3: { start: 27, end: 39 },
        Q4: { start: 40, end: 52 },
      };

      const range = quarterRanges[quarter];
      if (!range) throw new Error(`Trimestru invalid: ${quarter}`);

      // Filter data for the selected quarter
      const quarterlyData = weeklyData.filter((item: any) => {
        const weekNumber =
          typeof item.week_number === "string" &&
          item.week_number.includes("-W")
            ? parseInt(item.week_number.split("-W")[1]) // Extract week number from "2024-W01"
            : item.week_number;

        return weekNumber >= range.start && weekNumber <= range.end;
      });

      // Sort data by week number
      quarterlyData.sort((a: any, b: any) => {
        const weekA =
          typeof a.week_number === "string" && a.week_number.includes("-W")
            ? parseInt(a.week_number.split("-W")[1])
            : a.week_number;

        const weekB =
          typeof b.week_number === "string" && b.week_number.includes("-W")
            ? parseInt(b.week_number.split("-W")[1])
            : b.week_number;

        return weekA - weekB;
      });

      // Prepare chart data based on graph type
      const weekLabels: string[] = [];
      const chartValues: number[] = [];
      const pointBackgroundColors: string[] = [];

      quarterlyData.forEach((item: any) => {
        let value = 0;

        switch (graphType) {
          case "GE":
            value = item.ge * 100 || 0;
            break;
          case "Volume Produced":
            value = item.produced_volume || 0;
            break;
          case "Waste":
            value = item.waste || 0;
            break;
          case "Speed Loss":
            value = item.speed_loss || 0;
            break;
          default:
            value = 0;
        }

        // Format week label
        let weekLabel = "";
        if (
          typeof item.week_number === "string" &&
          item.week_number.includes("-W")
        ) {
          weekLabel = item.week_number;
        } else {
          weekLabel = `S${item.week_number}`;
        }

        weekLabels.push(weekLabel);
        chartValues.push(value);

        // Get target value for color coding
        const targetValue = targets.find(
          (t) => t.operation === graphType
        )?.target;
        const isWaste = graphType === "Waste" || graphType === "Speed Loss";

        // Set point color based on target comparison
        if (targetValue === undefined) {
          pointBackgroundColors.push("rgba(21, 233, 56, 1)");
        } else {
          const isGood = isWaste ? value <= targetValue : value >= targetValue;
          pointBackgroundColors.push(
            isGood ? "rgba(21, 233, 56, 1)" : "rgba(255, 99, 132, 1)"
          );
        }
      });

      // Create segment colors - use the RIGHT point's color for each segment
      const segmentColors = pointBackgroundColors.slice(1); // Use colors from index 1 onwards
      const segmentBackgroundColors = segmentColors.map((color) =>
        color.replace("1)", "0.2)")
      );

      // Create chart configuration
      const chartConfig = {
        labels: weekLabels,
        datasets: [
          {
            label: graphType,
            data: chartValues,
            borderColor: (ctx: any) => {
              // For the segment between point i and i+1, use the color of point i+1 (right point)
              if (
                ctx.p0DataIndex !== undefined &&
                ctx.p0DataIndex < segmentColors.length
              ) {
                return segmentColors[ctx.p0DataIndex];
              }
              return "rgba(157, 6, 208, 1)"; // Fallback color
            },
            backgroundColor: (ctx: any) => {
              // For the segment between point i and i+1, use the background color of point i+1
              if (
                ctx.p0DataIndex !== undefined &&
                ctx.p0DataIndex < segmentBackgroundColors.length
              ) {
                return segmentBackgroundColors[ctx.p0DataIndex];
              }
              return "rgba(174, 128, 189, 0.2)"; // Fallback color
            },
            pointBackgroundColor: pointBackgroundColors,
            pointBorderColor: pointBackgroundColors,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7,
            segment: {
              borderColor: (ctx: any) => {
                // For the segment between point i and i+1, use the color of point i+1
                if (
                  ctx.p0DataIndex !== undefined &&
                  ctx.p0DataIndex < segmentColors.length
                ) {
                  return segmentColors[ctx.p0DataIndex];
                }
                return "rgba(157, 6, 208, 1)"; // Fallback color
              },
            },
          },
        ],
      };

      // Add target line if available
      const targetValue = targets.find(
        (t) => t.operation === graphType
      )?.target;
      if (targetValue !== undefined) {
        chartConfig.datasets.push({
          label: `Target ${targetValue}${
            graphType === "Volume Produced" ? "t" : "%"
          }`,
          data: Array(chartValues.length).fill(targetValue),
          borderWidth: 2,
          borderColor: "rgb(255, 215, 0)",
          backgroundColor: "rgba(255, 215, 0, 0.1)",
          pointRadius: 0,
          borderDash: [5, 5],
          fill: false,
          tension: 0,
        });
      }

      // Set the appropriate chart data
      switch (graphType) {
        case "GE":
          setChartDataGE(chartConfig);
          break;
        case "Volume Produced":
          setChartDataVolume(chartConfig);
          break;
        case "Waste":
          setChartDataWaste(chartConfig);
          break;
        case "Speed Loss":
          setChartDataSpeed(chartConfig);
          break;
      }
    } catch (err) {
      console.error(err);
      setAlertVisiblity(true);
    } finally {
      setLoading(false);
    }
  };

  // functie adaugare pentru dms table
  const handleAddDMSAction = async (newAction: any) => {
    setLoading(true);
    try {
      const response = await fetch(`http://${path}:5000/add-dms-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: newAction }),
      });

      if (!response.ok) throw new Error("Eroare la adăugarea acțiunii DMS");

      const data = await response.json();

      // Refresh the DMS action data after successful addition
      await fetchDMSActionData(dmsFilter);

      console.log("DMS action added successfully:", data);
      return data;
    } catch (err) {
      console.error("Error adding DMS action:", err);
      setAlertVisiblity(true);
      throw err; // Re-throw to handle in the popup
    } finally {
      setLoading(false);
    }
  };

  // functie stergere pentru dms table
  const handleDeleteDMSAction = async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`http://${path}:5000/delete-dms-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error("Eroare la ștergerea acțiunii DMS");

      const data = await response.json();

      // Refresh the DMS action data after successful deletion
      await fetchDMSActionData(dmsFilter);

      console.log("DMS action deleted successfully:", data);
      return data;
    } catch (err) {
      console.error("Error deleting DMS action:", err);
      setAlertVisiblity(true);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // functie render dms table
  const renderDMSActionTable = () => {
    const headers = [
      "Location",
      "Action",
      "Responsible Team",
      "Due Date",
      "Status",
    ];

    // Color coding function similar to Section Manager log viewer
    const getRowColor = (status: string, dueDate: string) => {
      const today = new Date();
      const due = new Date(dueDate);

      // Completed actions - GREEN
      if (status === "completed") {
        return "green-row";
      }

      // Overdue actions - RED (active status but past due date)
      if (status === "active" && due < today) {
        return "red-row";
      }

      // Active but not overdue actions - YELLOW
      if (status === "active" && due >= today) {
        return "yellow-row";
      }

      // Default color
      return "";
    };

    const handleRowClick = async (index: number) => {
      const action = dmsActionData[index];

      const confirmDelete = window.confirm(
        "Are you sure you want to delete this action?"
      );

      if (confirmDelete) {
        try {
          await handleDeleteDMSAction(action.id);
          // The data will be refreshed automatically via fetchDMSActionData in the delete function
        } catch (error) {
          console.error("Failed to delete action:", error);
          alert("Failed to delete action. Please try again.");
        }
      }
    };

    // Update the handleUpdateDMS function to use the correct parameter name
    const handleUpdateDMS = async (id: number, newStatus: string) => {
      setLoading(true);
      try {
        const response = await fetch(`http://${path}:5000/update-dms-action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: id,
            status: newStatus,
          }),
        });

        if (!response.ok) throw new Error("Eroare la actualizarea statusului");

        const data = await response.json();

        // Refresh the DMS action data after successful update
        await fetchDMSActionData(dmsFilter);

        console.log("DMS action status updated successfully:", data);
        return data;
      } catch (err) {
        console.error("Error updating DMS action status:", err);
        setAlertVisiblity(true);
        throw err;
      } finally {
        setLoading(false);
      }
    };

    return (
      <>
        <div className="table-container">
          <table className="dms-action-table">
            <thead>
              <tr>
                {headers.map((header, index) => (
                  <th key={index}>
                    {header}
                    {dmsFilter[header.toLowerCase()] &&
                      ` (${dmsFilter[header.toLowerCase()]})`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dmsActionData.map((row, index) => {
                const rowClass = getRowColor(row.status, row.dueDate);

                return (
                  <tr
                    key={index}
                    onClick={() => {
                      handleRowClick(index);
                    }}
                    style={{ cursor: "pointer" }}
                    className={`dms-action-row ${rowClass}`}
                  >
                    <td>{row.location}</td>
                    <td>{row.action}</td>
                    <td>{row.responsibleTeam}</td>
                    <td>{row.dueDate}</td>
                    <td
                      onClick={(e) => {
                        e.stopPropagation();

                        const newStatus =
                          row.status === "active" ? "completed" : "active";

                        const statusText =
                          newStatus === "completed"
                            ? "finalizată"
                            : "reactivată";

                        const confirmUpdate = window.confirm(
                          `Sigur dorești să marchezi această acțiune ca ${statusText}?`
                        );

                        if (confirmUpdate) {
                          handleUpdateDMS(row.id, newStatus);
                        }
                      }}
                      style={{
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                      title={`Click pentru a marca ca ${
                        row.status === "active" ? "finalizată" : "reactivată"
                      }`}
                    >
                      {row.status === "active" ? "Active" : "Completed"}
                    </td>
                  </tr>
                );
              })}

              {dmsActionData.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center"
                    style={{ color: "white", height: "3rem" }}
                  >
                    There are no due actions.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3">
          <button
            className="btn-inapoi btn-primary"
            style={{ marginRight: "10px" }}
            onClick={() => setShowAddActionPopup(true)}
          >
            Add Action
          </button>
          {!Object.keys(dmsFilter).some(
            (key) => key !== "status" || dmsFilter[key] !== "active"
          ) && (
            <button
              className="btn-inapoi btn-info"
              onClick={() => setShowFilterPopup(true)}
            >
              Filter
            </button>
          )}
          {Object.keys(dmsFilter).some(
            (key) => key !== "status" || dmsFilter[key] !== "active"
          ) && (
            <button
              className="btn-inapoi btn-primary"
              style={{ marginLeft: "1rem" }}
              onClick={async () => {
                const defaultFilters = { status: "active" };
                setDmsFilter(defaultFilters);
                await fetchDMSActionData(defaultFilters);
              }}
            >
              🗑️ Clear Filters
            </button>
          )}
        </div>
      </>
    );
  };

  // formatare date log viewer
  const formatProductionDataForTable = (entry: any) => {
    const lines = [];

    // aspecte statice
    if (entry.shift) lines.push(`Schimb: ${entry.shift}`);
    if (entry.team_leader_name)
      lines.push(`Team Leader: ${entry.team_leader_name}`);
    if (entry.product_description)
      lines.push(`Produs: ${entry.product_description}`);
    if (entry.volume_produced !== undefined)
      lines.push(
        `Volum produs: ${Number(entry.volume_produced).toFixed(2)} kg`
      );
    if (entry.hours_used !== undefined)
      lines.push(`Ore utilizate: ${entry.hours_used}h`);
    if (entry.production_hours !== undefined)
      lines.push(`Ore producție: ${entry.production_hours}h`);
    if (entry.official_holidays !== undefined)
      lines.push(`Holidays: ${entry.official_holidays}h`);
    if (entry.no_demand !== undefined)
      lines.push(`No Demand: ${entry.no_demand}h`);
    if (entry.force_majeure !== undefined)
      lines.push(`Force Majeure: ${entry.force_majeure}h`);
    if (entry.waste !== undefined)
      lines.push(`Waste: ${Number(entry.waste).toFixed(2)} kg`);
    if (entry.ge !== undefined)
      lines.push(`GE: ${Number(entry.ge * 100).toFixed(2)}%`);

    // aspecte dinamice
    if (entry.minor_stoppages !== undefined)
      lines.push(
        `Minor Stoppages: ${Number(
          (entry.minor_stoppages / (Number(entry.hours_used) * 60)) * 100
        ).toFixed(2)}%`
      );

    if (entry.breakdowns !== undefined)
      lines.push(
        `Breakdowns: ${Number(
          (entry.breakdowns / (Number(entry.hours_used) * 60)) * 100
        ).toFixed(2)}%`
      );

    if (entry.operational_losses !== undefined)
      lines.push(
        `Operational Losses: ${Number(
          (entry.operational_losses / (Number(entry.hours_used) * 60)) * 100
        ).toFixed(2)}%`
      );

    if (entry.labor_management_losses !== undefined)
      lines.push(
        `Labor Management Losses: ${Number(
          (entry.labor_management_losses / (Number(entry.hours_used) * 60)) *
            100
        ).toFixed(2)}%`
      );

    if (entry.line_delays !== undefined)
      lines.push(
        `Line Delays: ${Number(
          (entry.line_delays / (Number(entry.hours_used) * 60)) * 100
        ).toFixed(2)}%`
      );

    if (entry.material_shortages !== undefined)
      lines.push(
        `Material Shortages: ${Number(
          (entry.material_shortages / (Number(entry.hours_used) * 60)) * 100
        ).toFixed(2)}%`
      );

    if (entry.planned_maintenance !== undefined)
      lines.push(
        `Planned Maintenance: ${Number(
          (entry.planned_maintenance / (Number(entry.hours_used) * 60)) * 100
        ).toFixed(2)}%`
      );

    if (entry.planned_autonomous_maintenance !== undefined)
      lines.push(
        `Planned Autonomous Maintenance: ${Number(
          (entry.planned_autonomous_maintenance /
            (Number(entry.hours_used) * 60)) *
            100
        ).toFixed(2)}%`
      );

    if (entry.sanitation !== undefined)
      lines.push(
        `Sanitation: ${Number(
          (entry.sanitation / (Number(entry.hours_used) * 60)) * 100
        ).toFixed(2)}%`
      );

    if (entry.changeovers !== undefined)
      lines.push(
        `Changeovers: ${Number(
          (entry.changeovers / (Number(entry.hours_used) * 60)) * 100
        ).toFixed(2)}%`
      );

    if (entry.planned_stops !== undefined)
      lines.push(
        `Planned Stops: ${Number(
          (entry.planned_stops / (Number(entry.hours_used) * 60)) * 100
        ).toFixed(2)}%`
      );

    if (entry.consumables_replacement !== undefined)
      lines.push(
        `Consumables replacement: ${Number(
          (entry.consumables_replacement / (Number(entry.hours_used) * 60)) *
            100
        ).toFixed(2)}%`
      );

    if (entry.start_finish_production !== undefined)
      lines.push(
        `Start and Finish Production: ${Number(
          (entry.start_finish_production / (Number(entry.hours_used) * 60)) *
            100
        ).toFixed(2)}%`
      );

    return lines.join("\n");
  };

  // Render section manager production table
  const renderProductionLogTable = () => {
    if (logViewerData.length === 0) {
      return <p>Nu există date de producție pentru data selectată.</p>;
    }

    const getRowColor = (
      volume,
      waste,
      ge,
      operationalLosses,
      minorStoppages,
      breakdowns,
      lineDelays,
      laborManagementLosses,
      materialShortages,
      plannedMaintenance,
      plannedAutonomousMaintenance,
      sanitation,
      changeovers,
      plannedStops,
      consumablesReplacement,
      startFinishProduction
    ) => {
      const volumE = parseFloat(volume) || 0;
      const wastE = parseFloat(waste) || 0;
      const gE = parseFloat(ge) || 0;
      const opLosses = parseFloat(operationalLosses) || 0;
      const minorStops = parseFloat(minorStoppages) || 0;
      const breaks = parseFloat(breakdowns) || 0;
      const liDealys = parseFloat(lineDelays) || 0;
      const laManagement = parseFloat(laborManagementLosses) || 0;
      const maShortages = parseFloat(materialShortages) || 0;
      const plMaintenance = parseFloat(plannedMaintenance) || 0;
      const plAutoMaintenance = parseFloat(plannedAutonomousMaintenance) || 0;
      const san = parseFloat(sanitation) || 0;
      const changes = parseFloat(changeovers) || 0;
      const plStops = parseFloat(plannedStops) || 0;
      const consumables = parseFloat(consumablesReplacement) || 0;
      const startFinish = parseFloat(startFinishProduction) || 0;

      const allValues = [
        volumE,
        wastE,
        gE,
        opLosses,
        minorStops,
        breaks,
        liDealys,
        laManagement,
        maShortages,
        plMaintenance,
        plAutoMaintenance,
        san,
        changes,
        plStops,
        consumables,
        startFinish,
      ];

      // Check if any value exceeds thresholds
      const hasRed = allValues.some((value) => {
        if ((waste / volume) * 100 < 5) return false;
        if (value === gE && value < 50) return true;
        if (value !== volumE && value !== wastE && value !== gE && value > 20)
          return true;
        return false;
      });
      const hasYellow = allValues.some((value) => {
        if (value !== volumE && value !== wastE && value !== gE && value > 10)
          return true;
        if (value === gE && value < 60) return true;
      });

      if (hasRed) {
        return "red-row";
      } else if (hasYellow) {
        return "yellow-row";
      }
      return "green-row";
    };

    // Analyze which columns have all zero values
    const shouldShowColumn = (columnName) => {
      return logViewerData.some((card) => {
        const lines = card.text.split("\n");
        const getLineValue = (label) => {
          const line = lines.find((l) => l.startsWith(label));
          const value = line ? line.split(": ")[1] : "0";
          return parseFloat(value) || 0;
        };

        switch (columnName) {
          case "Holidays":
            return getLineValue("Holidays") > 0;

          case "No Demand":
            return getLineValue("No Demand") > 0;

          case "Force Majeure":
            return getLineValue("Force Majeure") > 0;

          case "Material Shortages":
            return getLineValue("Material Shortages") > 0;

          case "Labor Management Losses":
            return getLineValue("Labor Management Losses") > 0;

          case "Line Delays":
            return getLineValue("Line Delays") > 0;

          case "Breakdowns":
            return getLineValue("Breakdowns") > 0;

          case "Minor Stoppages":
            return getLineValue("Minor Stoppages") > 0;

          case "Operational Losses":
            return getLineValue("Operational Losses") > 0;

          case "Waste":
            return getLineValue("Waste") > 0;

          case "Planned Maintenance":
            return getLineValue("Planned Maintenance") > 0;

          case "Planned Autonomous Maintenance":
            return getLineValue("Planned Autonomous Maintenance") > 0;

          case "Sanitation":
            return getLineValue("Sanitation") > 0;

          case "Changeovers":
            return getLineValue("Changeovers") > 0;

          case "Planned Stops":
            return getLineValue("Planned Stops") > 0;

          case "Consumables replacement":
            return getLineValue("Consumables replacement") > 0;

          case "Start and Finish Production":
            return getLineValue("Start and Finish Production") > 0;

          default:
            return true; // Always show other columns
        }
      });
    };

    // Column visibility variables
    const showHolidays = shouldShowColumn("Holidays");
    const showNoDemand = shouldShowColumn("No Demand");
    const showForceMajeure = shouldShowColumn("Force Majeure");
    const showBreakdowns = shouldShowColumn("Breakdowns");
    const showMinorStoppages = shouldShowColumn("Minor Stoppages");
    const showOperationalLosses = shouldShowColumn("Operational Losses");
    const showMaterialShortages = shouldShowColumn("Material Shortages");
    const showLaborManagementLosses = shouldShowColumn(
      "Labor Management Losses"
    );
    const showLineDelays = shouldShowColumn("Line Delays");
    const showWaste = shouldShowColumn("Waste");
    const showPlannedMaintenance = shouldShowColumn("Planned Maintenance");
    const showPlannedAutonomousMaintenance = shouldShowColumn(
      "Planned Autonomous Maintenance"
    );
    const showSanitation = shouldShowColumn("Sanitation");
    const showChangeovers = shouldShowColumn("Changeovers");
    const showPlannedStops = shouldShowColumn("Planned Stops");
    const showConsumablesReplacement = shouldShowColumn(
      "Consumables replacement"
    );
    const showStartFinishProduction = shouldShowColumn(
      "Start and Finish Production"
    );

    return (
      <div className="table-container">
        <table className="production-table">
          <thead>
            <tr>
              {[
                "Schimb",
                "Team Leader",
                "Produs",
                "Volum Produs",
                "Ore Utilizate",
                ...(showHolidays ? ["Holidays"] : []),
                ...(showNoDemand ? ["No Demand"] : []),
                ...(showForceMajeure ? ["Force Majeure"] : []),
                "GE",
                ...(showWaste ? ["Waste"] : []),
                ...(showMinorStoppages ? ["Minor Stoppages"] : []),
                ...(showBreakdowns ? ["Breakdowns"] : []),
                ...(showOperationalLosses ? ["Operational Losses"] : []),
                ...(showMaterialShortages ? ["Material Shortages"] : []),
                ...(showLaborManagementLosses
                  ? ["Labor Management Losses"]
                  : []),
                ...(showLineDelays ? ["Line Delays"] : []),
                ...(showPlannedMaintenance ? ["Planned Maintenance"] : []),
                ...(showPlannedAutonomousMaintenance
                  ? ["Planned Autonomous Maintenance"]
                  : []),
                ...(showSanitation ? ["Sanitation"] : []),
                ...(showChangeovers ? ["Changeovers"] : []),
                ...(showPlannedStops ? ["Planned Stops"] : []),
                ...(showConsumablesReplacement
                  ? ["Consumables replacement"]
                  : []),
                ...(showStartFinishProduction
                  ? ["Start and Finish Production"]
                  : []),
              ].map((header, index) => (
                <th
                  key={index}
                  onClick={() =>
                    selectedLogDate &&
                    handleHeaderClick(header, selectedLogDate)
                  }
                  style={{
                    cursor: [
                      "Breakdowns",
                      "Minor Stoppages",
                      "Operational Losses",
                    ].includes(header)
                      ? "pointer"
                      : "default",
                  }}
                  className={
                    [
                      "Breakdowns",
                      "Minor Stoppages",
                      "Operational Losses",
                    ].includes(header)
                      ? "clickable-header"
                      : ""
                  }
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {logViewerData.map((card, index) => {
              const lines = card.text.split("\n");
              const getLineValue = (label: string) => {
                const line = lines.find((l) => l.startsWith(label));
                return line ? line.split(": ")[1] : "";
              };

              // Get all values for color coding and display
              const ge = getLineValue("GE");
              const volume = getLineValue("Volum produs");
              const operationalLosses = getLineValue("Operational Losses");
              const minorStoppages = getLineValue("Minor Stoppages");
              const breakdowns = getLineValue("Breakdowns");
              const waste = getLineValue("Waste");
              const materialShortages = getLineValue("Material Shortages");
              const laborManagementLosses = getLineValue(
                "Labor Management Losses"
              );
              const lineDelays = getLineValue("Line Delays");
              const plannedMaintenance = getLineValue("Planned Maintenance");
              const plannedAutonomousMaintenance = getLineValue(
                "Planned Autonomous Maintenance"
              );
              const sanitation = getLineValue("Sanitation");
              const changeovers = getLineValue("Changeovers");
              const plannedStops = getLineValue("Planned Stops");
              const consumablesReplacement = getLineValue(
                "Consumables replacement"
              );
              const startFinishProduction = getLineValue(
                "Start and Finish Production"
              );

              const rowClass = getRowColor(
                volume,
                waste,
                ge,
                operationalLosses,
                minorStoppages,
                breakdowns,
                lineDelays,
                laborManagementLosses,
                materialShortages,
                plannedMaintenance,
                plannedAutonomousMaintenance,
                sanitation,
                changeovers,
                plannedStops,
                consumablesReplacement,
                startFinishProduction
              );

              const checkNull = (int) => {
                if (
                  getLineValue(int) === "nullh" ||
                  getLineValue(int) === "0.00%" ||
                  getLineValue(int) === "" ||
                  getLineValue(int) === "0.00 kg" ||
                  getLineValue(int) === "NaN%"
                ) {
                  return "-";
                }
                return getLineValue(int);
              };

              return (
                <tr key={index} className={rowClass}>
                  <td>{checkNull("Schimb")}</td>
                  <td>{checkNull("Team Leader")}</td>
                  <td>{checkNull("Produs")}</td>
                  <td>{checkNull("Volum produs")}</td>
                  <td>{checkNull("Ore utilizate")}</td>
                  {showHolidays && <td>{checkNull("Holidays")}</td>}

                  {showNoDemand && <td>{checkNull("No Demand")}</td>}
                  {showForceMajeure && <td>{checkNull("Force Majeure")}</td>}
                  <td>{checkNull("GE")}</td>
                  {showWaste && <td>{checkNull("Waste")}</td>}
                  {showMinorStoppages && (
                    <td>{checkNull("Minor Stoppages")}</td>
                  )}
                  {showBreakdowns && <td>{checkNull("Breakdowns")}</td>}
                  {showOperationalLosses && (
                    <td>{checkNull("Operational Losses")}</td>
                  )}
                  {showMaterialShortages && (
                    <td>{checkNull("Material Shortages")}</td>
                  )}
                  {showLaborManagementLosses && (
                    <td>{checkNull("Labor Management Losses")}</td>
                  )}
                  {showLineDelays && <td>{checkNull("Line Delays")}</td>}
                  {showPlannedMaintenance && (
                    <td>{checkNull("Planned Maintenance")}</td>
                  )}
                  {showPlannedAutonomousMaintenance && (
                    <td>{checkNull("Planned Autonomous Maintenance")}</td>
                  )}
                  {showSanitation && <td>{checkNull("Sanitation")}</td>}
                  {showChangeovers && <td>{checkNull("Changeovers")}</td>}
                  {showPlannedStops && <td>{checkNull("Planned Stops")}</td>}
                  {showConsumablesReplacement && (
                    <td>{checkNull("Consumables replacement")}</td>
                  )}
                  {showStartFinishProduction && (
                    <td>{checkNull("Start and Finish Production")}</td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // functiile cu sideeffect
  useEffect(() => {
    if (selectedMachine && selectedMachineMonth) {
      console.log(
        "Auto-fetching machine data:",
        selectedMachine,
        selectedMachineMonth
      );
      fetchMachineData(selectedMachine, selectedMachineMonth);
    }
  }, [selectedMachine, selectedMachineMonth]);

  useEffect(() => {
    if (selectedPosition === "Line Lead") {
      fetchProductionPlanData(selectedDate);
      fetchBOSData();
      fetchNMData();
    }
  }, [selectedPosition, selectedDate]);

  useEffect(() => {
    if (selectedInitial === "DMS Action Table") {
      fetchDMSActionData(dmsFilter);
    }
  }, [selectedInitial]);

  useEffect(() => {
    const fetchTargets = async () => {
      try {
        const response = await fetch("./data/target.json");
        if (!response.ok) throw new Error("Failed to fetch targets");
        const targetData = await response.json();
        setTargets(targetData);
      } catch (error) {
        console.error("Error fetching targets:", error);
      }
    };
    fetchTargets();
  }, []);

  // Add this useEffect to handle URL changes and browser navigation
  useEffect(() => {
    // Function to update state based on current URL
    const updateStateFromUrl = () => {
      const hash = window.location.hash.replace("#", "");
      setCurrentPath(hash);

      // Reset all selections first
      setSelectedInitial(null);
      setSelectedPosition(null);
      setSelectedDataset(null);
      setSelectedGraph(null);
      setSelectedTime(null);
      setSelectedQuarter(null);
      setSelectedMachine(null);
      setSelectedMachineMonth(new Date().toISOString().slice(0, 7));
      setSelectedDMSActionTable(null);
      setShowDateForm(false);
      setShowMonthForm(false);

      // Set state based on URL
      switch (hash) {
        case "home":
        case "":
          // Home page - no selections needed
          break;
        case "Adaugă documente":
        case "DMS Action Table":
        case "Verifică statistica":
        case "Graphs":
          setSelectedInitial(hash);
          break;
        case "Section Manager":
        case "Process Engineer":
        case "Line Lead":
          setSelectedPosition(hash);
          break;
        case "Month":
        case "Quarter":
        case "Specific Machine":
          setSelectedTime(hash);
          break;
        // Add more cases as needed for deeper navigation
        default:
          // Try to find if it matches any initial
          if (initials.includes(hash)) {
            setSelectedInitial(hash);
          } else if (positions.includes(hash)) {
            setSelectedPosition(hash);
          } else if (times.includes(hash)) {
            setSelectedTime(hash);
          }
          break;
      }
    };

    // Initial state setup from URL
    updateStateFromUrl();

    // Handle browser back/forward buttons
    const handlePopState = () => {
      updateStateFromUrl();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // formatare date pentru graph pe sferturi de an
  const handleSelectItemForQuarterlyGraphs = async (
    quarter: string,
    graphType: string
  ) => {
    await fetchWeeklyData(quarter, graphType);
  };

  // functie adaugare raport
  const handleSaveRaport = async () => {
    const cleanRaport = {
      tip: newRaport.tip || "",
      tipSecundar: newRaport.tipSecundar || "",
      oraIn: newRaport.oraIn || "",
      oraOut: newRaport.oraOut || "",
      zona: newRaport.zona || "",
      masina: newRaport.masina || "",
      ansamblu: newRaport.ansamblu || "",
      problema: newRaport.problema || "",
    };

    // apelam backend si verificam erori
    try {
      const res = await fetch(`http://${path}:5000/add-raport`, {
        method: "POST", // evident postam
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: Form(dateNow), raport: cleanRaport }),
      });
      if (!res.ok) throw new Error("Eroare la salvarea raportului");
      alert("Raport salvat cu succes!");
      setSelectedDataset(null);
    } catch (err) {
      console.error(err);
      alert("Nu s-a putut salva raportul.");
    }
  };

  // logica adaugare comentarii
  const handleComments = async (index: number) => {
    if (
      selectedDataset === "Minor Stoppages" ||
      selectedDataset === "Operational Losses" ||
      selectedDataset === "Breakdowns"
    ) {
      const comment = prompt("Add comments:");
      if (comment !== null) {
        setCardsData((prevCards) => {
          const newCards = [...prevCards];
          newCards[index] = {
            ...newCards[index],
            text: newCards[index].text + `\nComments: ${comment}`,
            comment: comment,
          };
          return newCards;
        });

        // aici facem post in json
        try {
          const res = await fetch(`http://${path}:5000/update-comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date: Form(dateNow), // data curenta din nume
              cardIndex: index,
              comment: comment,
            }),
          });
          if (!res.ok) throw new Error("Erorr at comment actualization.");
        } catch (err) {
          console.error(err);
          alert("Comments couldn't be saved.");
        }
      }
    }
  };

  // functie generare pdf - graph
  const handlePdf = async () => {
    const element = printRef.current;

    if (!element) return;

    const canvas = await html2canvas(element);
    const data = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: "a4",
    });

    const imgProperties = pdf.getImageProperties(data);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight =
      (imgProperties.height * pdfWidth) / imgProperties.width / 1.1;

    pdf.addImage(data, "PNG", 0, pdfHeight / 2, pdfWidth, pdfHeight);
    pdf.save(`${Form(dateNow)} - ${selectedGraph}.pdf`);
  };

  // functie generare pdf - log viewer
  const handleExportToPDF = async () => {
    if (!selectedHeader || !selectedLogDate) return;

    try {
      // Set ignoreH4 first and wait for next render cycle
      setIgnoreH4(true);

      // Wait for React to re-render
      await new Promise((resolve) => setTimeout(resolve, 50));

      const exportContainer = document.getElementById("pdf-container");

      if (!exportContainer) {
        console.error("Export container not found");
        setIgnoreH4(false);
        return;
      }

      const canvas = await html2canvas(exportContainer, {
        scale: 2,
        useCORS: true,
        windowWidth: 794,
        windowHeight: exportContainer.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Fixed: Remove the vertical offset
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${selectedHeader}-${selectedLogDate}.pdf`);
    } catch (error) {
      console.error("PDF generation error:", error);
    } finally {
      // Ensure h4 is always shown again after PDF generation
      setIgnoreH4(false);
    }
  };

  // const pentru cele 6 grupuri de butoane
  const initials = ["Drag & Drop", "DMS Action Table", "KPIs", "Graphs"];
  const positions = ["Section Manager", "Process Engineer", "Line Lead"];
  const items = ["GE & Stats", "Loss Management", "Stops"];
  const machines = [
    "Mixare",
    "Margarine pump",
    "Multiroller",
    "Lamination",
    "Trivi 1",
    "Trivi 2",
    "Loading trays",
    "Fermentation room",
    "Downloading trays",
    "Oven",
    "Cooling tower",
    "Injection M1",
    "Injection M2",
    "Injection M3",
    "Injection M4",
    "Cream pumps",
    "Scaricatore",
    "Tempering machine",
    "Enrobing machine",
    "Cooling tunnel 1",
    "Cooling tunnel 2",
    "Retractable belt",
    "Packaging module belts",
    "Packaging machine 1(horizontal)1",
    "Packaging machine 1(horizontal)2",
    "Packaging machine 1(horizontal)3",
    "Packaging machine 1(horizontal)4",
    "Packaging machine 1(horizontal)5",
    "Packaging machine 1(vertical)1",
    "Packaging machine 1(vertical)2",
    "Packaging machine 1(vertical)3",
    "Packaging machine 1(vertical)4",
    "Metal detector",
    "Forming cartons - Die Cut",
    "Closing boxes machine",
    "Decoration",
    "Washing machine",
  ];
  const rapoarte = ["Vezi Rapoarte", "Adaugă Raport"];
  const loss = ["Operational Losses", "Minor Stoppages", "Breakdowns"];
  const times = ["Specific Machine", "Quarter", "Month"];
  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  const graphs = ["GE", "Volume Produced", "Waste", "Speed Loss"];

  //

  //

  // ascunde scroll
  useEffect(() => {
    if (
      (selectedDataset === "GE & Stats" &&
        selectedPosition === "Process Engineer") ||
      selectedInitial === "Drag & Drop"
    ) {
      document.body.classList.remove("hide-scroll");
    } else {
      document.body.classList.add("hide-scroll");
    }
  }, [selectedPosition, selectedDataset]);

  // functie pentru selectie pozitie
  const handleSelectPosition = async (position: string) => {
    if (position === "Process Engineer" || position === "Line Lead") {
      setSelectedPosition(position);
      setShowDateForm(true);
      return;
    }
    setSelectedPosition(position);
    setCardsData([]);
    setAlertVisiblity(false);
    setNotIgnore(true);

    // verificare control backend
    if (!first.current) {
      firstFetch();
      first.current = true;
    }

    window.history.pushState({ position }, "", `#${position}`);
  };

  // functie pentru selectie graph
  const handleSelectGraph = async (graph: string) => {
    setSelectedGraph(graph);
    setCardsData([]);
    setAlertVisiblity(false);
    setNotIgnore(true);

    if (selectedTime === "Quarter" && selectedQuarter) {
      // Fetch quarterly data
      handleSelectItemForQuarterlyGraphs(selectedQuarter, graph);
    } else if (selectedTime === "Month") {
      // Show month selection form for monthly data
      setShowMonthForm(true);
    }
  };

  // functie sfert an curent
  const getCurrentQuarter = () => {
    const currentMonth = new Date().getMonth() + 1;
    return `Q${Math.floor((currentMonth - 1) / 3) + 1}`;
  };

  // default quarter, nu poate fi mutat
  const [selectedQuarter, setSelectedQuarter] = useState<string | null>(
    getCurrentQuarter()
  );

  // functie selecte unitate timp
  const handleSelectTimes = async (time: string) => {
    setSelectedTime(time);
    setCardsData([]);
    setAlertVisiblity(false);
    setNotIgnore(true);
    window.history.pushState({ time }, "", `#${time}`);
  };

  // functie selectie initiala
  const handleSelectInitials = async (initial: string) => {
    if (initial === "KPIs") {
      setSelectedInitial(initial);
      return;
    }
    setSelectedInitial(initial);
    setCardsData([]);
    setAlertVisiblity(false);
    setNotIgnore(true);

    window.history.pushState({ section: initial }, "", `#${initial}`);
  };

  // functie selectie sfert an
  const handleQuarterSelect = async (quarter: string) => {
    setSelectedQuarter(quarter);
    setCardsData([]);
    setAlertVisiblity(false);
    setNotIgnore(true);

    // After selecting quarter, show the graph selection
    setSelectedGraph(null);
  };

  // functie eliminare rapoarte
  const handleEliminate = async (index: number) => {
    // confirmare
    const confirmDelete = window.confirm("Sigur vrei să elimini acest raport?");
    if (!confirmDelete) return;

    // eliminare locala din cardsData
    setCardsData((prevCards) => prevCards.filter((_, i) => i !== index));

    // eliminare din bd
    try {
      const res = await fetch(`http://${path}:5000/delete-raport`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: Form(dateNow), // current date key
          raportIndex: index, // index of the report to remove
        }),
      });

      if (!res.ok) throw new Error("Nu s-a putut elimina raportul pe server.");
    } catch (err) {
      console.error(err);
      alert("Eroare la eliminarea raportului de pe server.");
    }
  };

  // functie selectie tuple date
  const handleSelectItem = async (item: string) => {
    setAlertVisiblity(false);
    setNotIgnore(true);
    setCardsData([]);
    setLoading(true);
    setSelectedDataset(item);

    // Reset comparison when selecting a new dataset
    setComparisonDates([]);
    setComparisonCardsData({});
    setShowDateInput(false);

    try {
      const response = await fetch(`http://${path}:5000/data/${Form(dateNow)}`);
      if (!response.ok) throw new Error("Eroare la descărcarea fișierului");

      const data = await response.json();
      const dateData = data.data;

      if (item === "GE & Stats") {
        const oreReferintaEntry = dateData.inceput.find(
          (entry: any) => entry.operatie === "Hours used"
        );
        const oreReferintaVal = Number(oreReferintaEntry?.valoare || 1);

        const toneReferintaEntry = dateData.inceput.find(
          (entry: any) => entry.operatie === "Volume Produced"
        );
        const toneReferintaVal = Number(toneReferintaEntry?.valoare || 0);

        const allowedMetrics =
          selectedPosition === "Section Manager"
            ? null
            : geStatsByRole[selectedPosition || ""];

        const cards = dateData.inceput
          .filter((entry: any) => {
            if (allowedMetrics && !allowedMetrics.includes(entry.operatie)) {
              return false;
            }

            const value = entry.valoare;
            return value !== null && value !== undefined && Number(value) !== 0;
          })
          .map((entry: any) => {
            const value = entry.valoare;
            let displayValue = "";

            if (typeof value === null || value === undefined) {
              return null;
            } else if (typeof value === "string" && value.includes("%")) {
              displayValue = value;
            } else if (
              [
                "Hours used",
                "Production hours",
                "Defect-free full speed operating time",
              ].includes(entry.operatie)
            ) {
              displayValue = `${Number(value).toFixed(2)} ore`;
            } else if (
              [
                "Consumables replacement",
                "Labor Management Losses",
                "Material Shortages",
                "Quality Loss",
                "Speed Loss",
              ].includes(entry.operatie)
            ) {
              let temp = (Number(value) * 100).toFixed(2);
              displayValue = `${temp} %`;
            } else if (
              [
                "Planned Maintenance",
                "Planned Autonomous Maintenance",
                "Sanitation",
                "Changeovers",
                "Planned Stops",
                "Start and Finish Production",
                "Minor Stoppages",
                "Breakdowns",
                "Operational Losses",
                "Line Delays",
              ].includes(entry.operatie)
            ) {
              let temp = Math.round(Number(value) * 60) * oreReferintaVal;
              displayValue = `${temp} minute`;
            } else if (["Volume Produced"].includes(entry.operatie)) {
              displayValue = `${toneReferintaVal.toFixed(2)} tone`;
            } else {
              displayValue = `${(value * 100).toFixed(2)} %`;
            }

            return {
              header: entry.operatie,
              text: displayValue,
            };
          })
          .filter((card: any) => card !== null && card.text !== "0 %");

        setCardsData(cards);

        // For Process Engineer, also initialize comparison with current date
        if (selectedPosition === "Process Engineer") {
          const currentDate = new Date().toISOString().split("T")[0];
          setComparisonDates([currentDate]);
          setComparisonCardsData({
            [currentDate]: cards,
          });
        }
      } else {
        // ... rest of your existing handleSelectItem logic for other datasets
      }
    } catch (err) {
      console.error(err);
      setAlertVisiblity(true);
    } finally {
      setLoading(false);
    }
  };

  // functie modificare luna
  const handleMonthSubmit = (e: React.FormEvent, graphType: string) => {
    e.preventDefault();
    setSelectedMonth(selectedMonthInput);
    setShowMonthForm(false);
    handleSelectItemForGraphs(selectedMonthInput, graphType);
  };

  // functie modificare element analizat per graph
  const handleSelectItemForGraphs = async (
    month: string,
    graphType: string
  ) => {
    setAlertVisiblity(false);
    setNotIgnore(true);
    setLoading(true);

    try {
      const response = await fetch(`http://${path}:5000/data/month/${month}`);
      if (!response.ok) throw new Error("Eroare la descărcarea datelor lunare");

      const data = await response.json();
      const monthlyData: MonthlyDataEntry[] = data.data || [];

      // Extract year and month
      const [year, monthNum] = month.split("-").map(Number);
      const daysInMonth = new Date(year, monthNum, 0).getDate();
      const allDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

      // Create a map of day to value for the specific operation type
      const dataMap = new Map();

      monthlyData.forEach((entry: MonthlyDataEntry) => {
        const dateStr = entry.date.toString();
        if (dateStr.length === 8) {
          const day = parseInt(dateStr.substring(6, 8), 10);

          // ONLY process the operation type we're interested in
          if (graphType === "GE" && entry.operatie === "GE") {
            const value = entry.valoare.toString().replace("%", "");
            dataMap.set(day, (parseFloat(value) * 100).toFixed(2) || 0);
          } else if (
            graphType === "Volume Produced" &&
            entry.operatie === "Volume Produced"
          ) {
            const value = entry.valoare.toString();
            dataMap.set(day, parseFloat(value).toFixed(2) || 0);
          } else if (graphType === "Waste" && entry.operatie === "Waste") {
            const value = entry.valoare.toString().replace("%", "");
            dataMap.set(day, (parseFloat(value) * 100).toFixed(2) || 0);
          } else if (
            graphType === "Speed Loss" &&
            entry.operatie === "Speed Loss"
          ) {
            const value = entry.valoare.toString().replace("%", "");
            dataMap.set(day, (parseFloat(value) * 100).toFixed(2) || 0);
          }
        }
      });

      // Prepare data for all days of the month
      const chartValues = allDays.map((day) => dataMap.get(day) || 0);

      // Get target value for this graph type
      const targetValue = targets.find(
        (t) => t.operation === graphType
      )?.target;

      // For Waste, we want the opposite logic (lower is better)
      const isWaste = graphType === "Waste" || graphType === "Speed Loss";

      // Create point colors based on target comparison
      const pointBackgroundColors = chartValues.map((value) => {
        if (targetValue === undefined) {
          return "rgba(21, 233, 56, 1)"; // Default to green if no target
        }

        const isGood = isWaste ? value <= targetValue : value >= targetValue;
        return isGood ? "rgba(21, 233, 56, 1)" : "rgba(255, 99, 132, 1)";
      });

      const pointBorderColors = pointBackgroundColors;

      // Create segment colors for the lines between points - always use left point color
      const segmentColors = [];
      const segmentBackgroundColors = [];

      for (let i = 0; i < chartValues.length - 1; i++) {
        // Always use the color of the right point (current point)
        const segmentColor = pointBackgroundColors[i + 1];
        segmentColors.push(segmentColor);
        segmentBackgroundColors.push(segmentColor.replace("1)", "0.2)")); // Convert to transparent version
      }

      // Create the main dataset with segment coloring
      const mainDataset = {
        label:
          graphType === "GE"
            ? "GE (%)"
            : graphType === "Volume Produced"
            ? "Volume Produced (t)"
            : graphType === "Waste"
            ? "Waste (%)"
            : "Speed Loss",
        data: chartValues,
        borderColor: (ctx: any) => {
          // Use the color of the RIGHT point for the segment
          if (
            ctx.p0DataIndex !== undefined &&
            ctx.p0DataIndex < segmentColors.length
          ) {
            return segmentColors[ctx.p0DataIndex];
          }
          return "rgba(174, 128, 189, 0.2)"; // Fallback color
        },
        backgroundColor: (ctx: any) => {
          // Use the color of the RIGHT point for the background
          if (
            ctx.p0DataIndex !== undefined &&
            ctx.p0DataIndex >= 0 &&
            ctx.p0DataIndex < segmentBackgroundColors.length
          ) {
            return segmentBackgroundColors[ctx.p0DataIndex];
          }
          return "rgba(174, 128, 189, 0.2)"; // Fallback color (should be transparent)
        },
        pointBackgroundColor: pointBackgroundColors,
        pointBorderColor: pointBorderColors,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        segment: {
          borderColor: (ctx: any) => {
            // Use the color of the RIGHT point for the segment
            if (
              ctx.p0DataIndex !== undefined &&
              ctx.p0DataIndex < segmentColors.length
            ) {
              return segmentColors[ctx.p0DataIndex];
            }
            return "rgba(75, 192, 192, 1)"; // Fallback color
          },
        },
      };
      // Common chart configuration
      const chartConfig = {
        labels: allDays.map((day) => day.toString()),
        datasets: [mainDataset],
      };

      // Add target dataset if target exists
      if (targetValue !== undefined) {
        chartConfig.datasets.push({
          label: `Target (${targetValue})`,
          data: Array(allDays.length).fill(targetValue),
          borderWidth: 2,
          borderColor: "rgb(255, 215, 0)",
          backgroundColor: "rgba(255, 215, 0, 0.1)",
          pointRadius: 0,
          borderDash: [5, 5],
          fill: false,
          tension: 0,
        });
      }

      // Set the chart data based on graph type
      if (graphType === "GE") {
        setChartDataGE(chartConfig);
      } else if (graphType === "Volume Produced") {
        setChartDataVolume(chartConfig);
      } else if (graphType === "Waste") {
        setChartDataWaste(chartConfig);
      } else if (graphType === "Speed Loss") {
        setChartDataSpeed(chartConfig);
      }
    } catch (err) {
      console.error(err);
      setAlertVisiblity(true);
    } finally {
      setLoading(false);
    }
  };

  // redare rapoarte
  const renderReportsTable = () => {
    return (
      <table className="table tb table-striped table-bordered">
        <thead>
          <tr>
            <th>Ora Început</th>
            <th>Ora Sfârșit</th>
            <th>Zona</th>
            <th>Tip</th>
            <th>Motiv</th>
            <th>Mașina</th>
            <th>Ansamblu</th>
            <th>Problema</th>
          </tr>
        </thead>
        <tbody>
          {cardsData.map((card, index) => {
            const lines = card.text.split("\n");
            const getLineValue = (label: string) => {
              const line = lines.find((l) => l.startsWith(label));
              return line ? line.split(": ")[1] : "";
            };
            return (
              <tr
                key={index}
                onClick={() => handleEliminate(index)}
                style={{ cursor: "no-drop" }}
              >
                <td>{getLineValue("Ora Inceput")}</td>
                <td>{getLineValue("Ora Sfarsit")}</td>
                <td>{getLineValue("Zona")}</td>
                <td>{getLineValue("Tip")}</td>
                <td>{getLineValue("Motiv")}</td>
                <td>{getLineValue("Masina")}</td>
                <td>{getLineValue("Ansamblu")}</td>
                <td>{getLineValue("Problema")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  // redare tabel productie
  const renderProductionTable = () => {
    const now = new Date(selectedDate);
    const currentDate = now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // Create a mapping of production entries with their parsed data
    const productionEntries = productionPlanData
      .map((card) => {
        const lines = card.text.split("\n");
        const getLineValue = (label: string) => {
          const line = lines.find((l) => l.startsWith(label));
          return line ? line.split(": ")[1] : "";
        };

        return {
          card,
          start_date: getLineValue("Start Date"),
          end_date: getLineValue("End Date"),
          tip_produs: getLineValue("Product Type"),
          gramaj: getLineValue("Gramaj"),
          pcs_bax: getLineValue("Pcs/Bax"),
          comanda_initiala: getLineValue("Comanda Initiala"),
          shifturi: getLineValue("Shifturi"),
          ore_productie: getLineValue("Ore Productie"),
        };
      })
      .filter((entry) => entry.start_date && entry.start_date !== "null");

    // Sort production data by start time
    const sortedProductionData = [...productionEntries].sort((a, b) => {
      const startDateA = new Date(a.start_date);
      const startDateB = new Date(b.start_date);
      return startDateA - startDateB;
    });

    // Process all productions and fill missing values from previous rows
    const processedProductions = [];
    let lastValidProduction = null;

    for (const entry of sortedProductionData) {
      try {
        const startTime = new Date(entry.start_date);
        const endTime = new Date(entry.end_date);

        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          continue;
        }

        const startDate = startTime.toDateString();
        const endDate = endTime.toDateString();
        const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
        const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

        // Create a new production entry with filled values
        const processedEntry = {
          ...entry,
          // Use current value if valid, otherwise use previous valid value
          tip_produs:
            entry.tip_produs && entry.tip_produs !== "null"
              ? entry.tip_produs
              : lastValidProduction?.tip_produs || "N/A",
          gramaj:
            entry.gramaj && entry.gramaj !== "null"
              ? entry.gramaj
              : lastValidProduction?.gramaj || "N/A",
          pcs_bax:
            entry.pcs_bax && entry.pcs_bax !== "null"
              ? entry.pcs_bax
              : lastValidProduction?.pcs_bax || "N/A",
          comanda_initiala:
            entry.comanda_initiala && entry.comanda_initiala !== "null"
              ? entry.comanda_initiala
              : lastValidProduction?.comanda_initiala || "N/A",
          startDateObj: startTime,
          endDateObj: endTime,
          startMinutes,
          endMinutes,
          startDate,
          endDate,
          isYesterday: startDate === yesterdayString,
        };

        // Update last valid production if this one has valid values
        if (entry.tip_produs && entry.tip_produs !== "null") {
          lastValidProduction = processedEntry;
        }

        processedProductions.push(processedEntry);
      } catch (error) {
        console.error("Error processing production entry:", error, entry);
      }
    }

    // Find current and upcoming productions (including yesterday's ongoing productions)
    let currentProduction = null;
    const upcomingProductions = [];

    for (const entry of processedProductions) {
      const isToday =
        entry.startDate === currentDate || entry.endDate === currentDate;
      const isYesterday = entry.isYesterday;
      const isFuture = entry.startDateObj > now;

      // Check if this production is currently active (including those that started yesterday)
      if (isToday || isYesterday) {
        const isCurrentlyActive =
          // Production started yesterday and is still active today
          (isYesterday &&
            entry.endDate === currentDate &&
            currentTime <= entry.endMinutes) ||
          // Production started today and is active now
          (isToday &&
            currentTime >= entry.startMinutes &&
            currentTime <= entry.endMinutes) ||
          // Production spans multiple days including today
          (isYesterday && entry.endDateObj > now);

        if (isCurrentlyActive) {
          currentProduction = entry;
        }
      }

      // Check if it's upcoming (future productions)
      if (isFuture) {
        upcomingProductions.push(entry);
      }
    }

    // Also include yesterday's productions that might still be relevant
    const yesterdaysProductions = processedProductions
      .filter((entry) => entry.isYesterday)
      .sort((a, b) => b.endMinutes - a.endMinutes); // Sort by end time, latest first

    // Prepare rows to display
    const rowsToDisplay = [];

    // Add current production if found
    if (currentProduction) {
      rowsToDisplay.push({
        ...currentProduction,
        isCurrent: true,
        displayType: "current",
      });
    }

    // Add yesterday's latest production if no current production found
    if (rowsToDisplay.length === 0 && yesterdaysProductions.length > 0) {
      const latestYesterday = yesterdaysProductions[0];
      rowsToDisplay.push({
        ...latestYesterday,
        isCurrent: false,
        displayType: "yesterday",
      });
    }

    // Add upcoming productions
    const neededUpcoming = 3 - rowsToDisplay.length;
    for (
      let i = 0;
      i < Math.min(neededUpcoming, upcomingProductions.length);
      i++
    ) {
      rowsToDisplay.push({
        ...upcomingProductions[i],
        isCurrent: false,
        displayType: "upcoming",
      });
    }

    // If we still need more rows, add today's productions
    if (rowsToDisplay.length < 3) {
      const todaysProductions = processedProductions
        .filter(
          (entry) =>
            entry.startDate === currentDate &&
            !rowsToDisplay.some((row) => row.start_date === entry.start_date)
        )
        .slice(0, 3 - rowsToDisplay.length);

      rowsToDisplay.push(
        ...todaysProductions.map((entry) => ({
          ...entry,
          isCurrent: false,
          displayType: "today",
        }))
      );
    }

    // "Ieri" for yesterday
    const formatTimeDisplay = (
      dateString: string,
      dateObj: Date,
      isEndTime: boolean = false,
      displayType: string
    ) => {
      const displayDate = dateObj.toDateString();

      if (displayDate !== currentDate && displayDate === yesterdayString) {
        return "Ieri";
      }

      if (displayDate !== currentDate && displayDate !== yesterdayString) {
        return "Mâine";
      }

      return extractHourMinute(dateString);
    };

    return (
      <table className="table tb-prod table-bordered">
        <thead>
          <td colSpan={8} className="table-title">
            Plan Productie
          </td>

          <tr>
            <th>Start Productie</th>
            <th>Sfârșit Productie</th>
            <th>Nume Produs</th>
            <th>Gramaj</th>
            <th>Bucati Bax</th>
            <th>Cantitate Comandata</th>
            <th>Shift</th>
            <th>Ore Productie</th>
          </tr>
        </thead>
        <tbody>
          {rowsToDisplay.map((entry, index) => {
            return (
              <tr
                key={index}
                className={entry.isCurrent ? "current-production" : ""}
                style={{ cursor: "no-drop" }}
              >
                <td>
                  {formatTimeDisplay(
                    entry.start_date,
                    entry.startDateObj,
                    false,
                    entry.displayType
                  )}
                </td>
                <td>
                  {formatTimeDisplay(
                    entry.end_date,
                    entry.endDateObj,
                    true,
                    entry.displayType
                  )}
                </td>
                <td>{entry.tip_produs}</td>
                <td>{entry.gramaj}</td>
                <td>{entry.pcs_bax}</td>
                <td>{Number(entry.comanda_initiala || 0)}</td>
                <td>{Number(entry.shifturi || 0).toFixed(2)}</td>
                <td>{Number(entry.ore_productie || 0).toFixed(2)}</td>
              </tr>
            );
          })}

          {rowsToDisplay.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center">
                <h2 className="eroare_productie">
                  Nu există date de producție pentru afișare.
                </h2>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    );
  };

  // redare tabel bos
  const renderBOSTable = () => {
    return (
      <div>
        <table className="table tb-bos table-bordered">
          <thead>
            <td colSpan={2}>Safety</td>
            <tr>
              <th>Actiune Sigura</th>
              <th>Actiune Nesigura</th>
            </tr>
          </thead>
          <tbody>
            {bosData.map((card, index) => {
              const lines = card.text.split("\n");
              const getLineValue = (label: string) => {
                const line = lines.find((l) => l.startsWith(label));
                return line ? line.split(": ")[1] : "";
              };
              return (
                <tr key={index} style={{ cursor: "no-drop" }}>
                  <td>{getLineValue("Actiune Sigura")}</td>
                  <td>{getLineValue("Actiune Nesigura")}</td>
                </tr>
              );
            })}
          </tbody>
          <thead>
            <tr>
              <th>Near Miss</th>
              <th>Unsafe Cond.</th>
            </tr>
          </thead>
          <tbody>
            {nmData.map((card, index) => {
              const lines = card.text.split("\n");
              const getLineValue = (label: string) => {
                const line = lines.find((l) => l.startsWith(label));
                return line ? line.split(": ")[1] : "";
              };
              return (
                <tr key={index} style={{ cursor: "no-drop" }}>
                  <td>{getLineValue("Near Miss")}</td>
                  <td>{getLineValue("Conditii Nesigure")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // logica de intoarcere la pozitii
  const handleBackToPositions = () => {
    setSelectedPosition(null);
    setCardsData([]);
    setAlertVisiblity(false);
    setNotIgnore(false);
    setSelectedDataset(null);
    setSelectedGraph(null);
    setSelectedTime(null);
    setSelectedQuarter(null);
    setChartDataGE(null);
    setChartDataVolume(null);
    setChartDataWaste(null);
    setSelectedMonth(null);
    setShowBOSTable(false);
  };

  // logica de intoarcere la sectii
  const handleBackToDatasets = () => {
    setSelectedDataset(null);
    setCardsData([]);
  };

  // functie de selectare data (inceput)
  const handleDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const temp = new Date(selectedDate);
    if (temp instanceof Date && !isNaN(temp.getTime())) {
      dateNow = temp;

      if (
        selectedPosition === "Process Engineer" &&
        selectedDataset === "GE & Stats"
      ) {
        // Add to comparison dates if not already present
        if (!comparisonDates.includes(selectedDate)) {
          setComparisonDates((prev) => [...prev, selectedDate]);
          // Fetch data for this date
          fetchDataForDate(selectedDate);
        }
      } else {
        // Original behavior for other cases
        setShowDateForm(false);
        if (selectedPosition === "Line Lead") {
          fetchProductionPlanData(selectedDate);
        }
      }

      setShowDateInput(false);
    }
  };

  const fetchDataForDate = async (date: string) => {
    setLoading(true);
    try {
      const tempDate = new Date(date);
      const formattedDate = Form(tempDate);

      const response = await fetch(`http://${path}:5000/data/${formattedDate}`);
      if (!response.ok) throw new Error("Eroare la descărcarea fișierului");

      const data = await response.json();
      const dateData = data.data;

      // Process GE & Stats data (same logic as original)
      const oreReferintaEntry = dateData.inceput.find(
        (entry: any) => entry.operatie === "Hours used"
      );
      const oreReferintaVal = Number(oreReferintaEntry?.valoare || 1);

      const toneReferintaEntry = dateData.inceput.find(
        (entry: any) => entry.operatie === "Volume Produced"
      );
      const toneReferintaVal = Number(toneReferintaEntry?.valoare || 0);

      const allowedMetrics = geStatsByRole[selectedPosition || ""];

      const cards = dateData.inceput
        .filter((entry: any) => {
          if (allowedMetrics && !allowedMetrics.includes(entry.operatie)) {
            return false;
          }

          const value = entry.valoare;
          return value !== null && value !== undefined && Number(value) !== 0;
        })
        .map((entry: any) => {
          const value = entry.valoare;
          let displayValue = "";

          if (typeof value === null || value === undefined) {
            return null;
          } else if (typeof value === "string" && value.includes("%")) {
            displayValue = value;
          } else if (
            [
              "Hours used",
              "Production hours",
              "Defect-free full speed operating time",
            ].includes(entry.operatie)
          ) {
            displayValue = `${Number(value).toFixed(2)} ore`;
          } else if (
            [
              "Consumables replacement",
              "Labor Management Losses",
              "Material Shortages",
              "Quality Loss",
              "Speed Loss",
            ].includes(entry.operatie)
          ) {
            let temp = (Number(value) * 100).toFixed(2);
            displayValue = `${temp} %`;
          } else if (
            [
              "Planned Maintenance",
              "Planned Autonomous Maintenance",
              "Sanitation",
              "Changeovers",
              "Planned Stops",
              "Start and Finish Production",
              "Minor Stoppages",
              "Breakdowns",
              "Operational Losses",
              "Line Delays",
            ].includes(entry.operatie)
          ) {
            let temp = Math.round(Number(value) * 60) * oreReferintaVal;
            displayValue = `${temp} minute`;
          } else if (["Volume Produced"].includes(entry.operatie)) {
            displayValue = `${toneReferintaVal.toFixed(2)} tone`;
          } else {
            displayValue = `${(value * 100).toFixed(2)} %`;
          }

          return {
            header: entry.operatie,
            text: displayValue,
            date: date, // Store the date for identification
          };
        })
        .filter((card: any) => card !== null && card.text !== "0 %");

      // Store the cards data for this date
      setComparisonCardsData((prev) => ({
        ...prev,
        [date]: cards,
      }));
    } catch (err) {
      console.error(err);
      setAlertVisiblity(true);
    } finally {
      setLoading(false);
    }
  };

  // Add function to remove a comparison date
  const handleRemoveComparisonDate = (dateToRemove: string) => {
    setComparisonDates((prev) => prev.filter((date) => date !== dateToRemove));
    setComparisonCardsData((prev) => {
      const newData = { ...prev };
      delete newData[dateToRemove];
      return newData;
    });
  };

  // functie formatare selectare luna
  const MonthSelectionForm = ({ graphType }: { graphType: string }) => (
    <div className="row-date g-2t">
      <form onSubmit={(e) => handleMonthSubmit(e, graphType)}>
        <div className="mb-3">
          <input
            type="month"
            className="form-control"
            id="monthInput"
            value={selectedMonthInput}
            onChange={(e) => setSelectedMonthInput(e.target.value)}
            required
          />
        </div>
        <div className="d-flex gap-2">
          <button type="submit" className="btn-inapoi btn-primary">
            Confirm
          </button>
          <button
            type="button"
            className="btn-inapoi btn-secondary"
            onClick={() => setSelectedGraph(null)}
          >
            Back
          </button>
        </div>
      </form>
    </div>
  );

  const fetchMachineData = async (machine: string, month?: string) => {
    setLoading(true);
    try {
      // Use provided month or default to selectedMachineMonth
      const monthToUse =
        month.replace("-", "") || selectedMachineMonth.replace("-", "");
      const response = await fetch(
        `http://${path}:5000/machine-data/${machine}/${monthToUse}`
      );

      if (!response.ok)
        throw new Error("Eroare la descărcarea datelor mașinii");

      const data = await response.json();

      if (data.status === "success") {
        const chartData = processMachineDataForChart(data.data);

        setChartDataMachine(chartData);
      } else {
        throw new Error(data.message || "Eroare la procesarea datelor");
      }
    } catch (err) {
      console.error(err);
      setAlertVisiblity(true);
    } finally {
      setLoading(false);
    }
  };

  const processMachineDataForChart = (machineData: any) => {
    const { dailyData, machine, month, summary } = machineData;

    // Convert month from YYYYMM to readable format
    const year = month.substring(0, 4);
    const monthNum = month.substring(4, 6);
    const monthNames = [
      "Ianuarie",
      "Februarie",
      "Martie",
      "Aprilie",
      "Mai",
      "Iunie",
      "Iulie",
      "August",
      "Septembrie",
      "Octombrie",
      "Noiembrie",
      "Decembrie",
    ];
    const monthName = monthNames[parseInt(monthNum) - 1];

    return {
      labels: dailyData.map((day: any) => day.day.toString()),
      datasets: [
        {
          label: "Breakdowns",
          data: dailyData.map((day: any) => day.breakdowns),
          backgroundColor: "rgba(157, 6, 208, 0.8)", // Purple
          borderColor: "rgba(157, 6, 208, 1)",
          borderWidth: 2,
        },
        {
          label: "Minor Stoppages",
          data: dailyData.map((day: any) => day.minorStoppages),
          backgroundColor: "rgba(255, 205, 86, 0.8)", // Yellow
          borderColor: "rgba(255, 205, 86, 1)",
          borderWidth: 2,
        },
        {
          label: "Operational Losses",
          data: dailyData.map((day: any) => day.operationalLosses),
          backgroundColor: "rgba(54, 162, 235, 0.8)", // Blue
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 2,
        },
      ],
      summary: summary,
    };
  };

  // Chart configuration for machine data (stacked bar chart)
  const propGraficaMasina = (machineName: string, timePeriod: string) => {
    // Convert YYYY-MM to readable month name
    const [year, monthNum] = timePeriod.split("-");
    const monthNames = [
      "Ianuarie",
      "Februarie",
      "Martie",
      "Aprilie",
      "Mai",
      "Iunie",
      "Iulie",
      "August",
      "Septembrie",
      "Octombrie",
      "Noiembrie",
      "Decembrie",
    ];
    const monthName = monthNames[parseInt(monthNum) - 1];
    const displayPeriod = `${monthName} ${year}`;

    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Minute",
            color: "#ba8bd3",
          },
          ticks: {
            color: "#ba8bd3",
          },
          grid: {
            color: "#ba8bd3",
          },
          stacked: true,
        },
        x: {
          title: {
            display: true,
            text: `Zilele lunii ${displayPeriod}`,
            color: "#ba8bd3",
          },
          ticks: {
            color: "#ba8bd3",
            maxRotation: 45,
          },
          grid: {
            color: "#ba8bd3",
          },
          stacked: true,
        },
      },
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: "#ba8bd3",
            font: {
              size: 14,
              weight: "bold",
            },
          },
        },
        tooltip: {
          callbacks: {
            label: function (context: any) {
              return `${context.dataset.label}: ${context.parsed.y} minute`;
            },
          },
        },
        title: {
          display: true,
          text: `Timp pierdut - ${machineName}`,
          color: "#ba8bd3",
          font: {
            size: 16,
            weight: "bold",
          },
        },
      },
    };
  };

  // jsx, deci DOM-ul site-ului
  return (
    <div className="container mt-4">
      <Breadcrumbs />
      <HeaderDetailsPopup />
      {showFilterPopup && <FilterPopup />}
      {showAddActionPopup && <AddActionPopup />}

      {alertVisible && (
        <Alert onClose={() => setAlertVisiblity(false)}>
          Eroare la încărcarea datelor. Verifică fișierul JSON.
        </Alert>
      )}
      {!selectedInitial ? (
        <>
          <ButtonGroup
            items={initials}
            heading="DMS-2 Digitalization Tool"
            onSelectItem={handleSelectInitials}
          />
        </>
      ) : selectedInitial === "Drag & Drop" ? (
        <div className="space-y-2">
          <>
            <Dropzone heading="BOS" uploadType="Formular BOS" />
            <Dropzone
              heading="Daily Management Session"
              uploadType="excelMare"
            />
            <Dropzone heading="Production Plan" uploadType="productionPlan" />
            <Dropzone
              heading="Unsafe Conditions"
              uploadType="Formular raportare eveniment la limita producerii unui accident sau situație periculoasă"
            />
          </>
        </div>
      ) : selectedInitial === "Graphs" && !selectedTime ? (
        <>
          <ButtonGroup
            items={times}
            heading="Select Graph Type"
            onSelectItem={handleSelectTimes}
          />
        </>
      ) : selectedTime === "Quarter" && !selectedQuarter ? (
        <>
          <ButtonGroup
            items={quarters}
            heading="Select Reference Quarter"
            onSelectItem={handleQuarterSelect}
          />
        </>
      ) : selectedTime === "Quarter" && selectedQuarter && !selectedGraph ? (
        <>
          <ButtonGroup
            items={graphs}
            heading={`Select KPI for ${selectedQuarter}`}
            onSelectItem={handleSelectGraph}
          />
        </>
      ) : selectedTime === "Quarter" && selectedQuarter && selectedGraph ? (
        <div className="mt-4">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              <h1>
                Data for {selectedGraph} - {selectedQuarter}
              </h1>
              {selectedGraph === "GE" && chartDataGE ? (
                <>
                  <div
                    ref={printRef}
                    className="dataCard graph"
                    style={{ height: "400px" }}
                    onClick={handlePdf}
                  >
                    <Line
                      data={chartDataGE}
                      options={propGrafica(
                        "GE %",
                        selectedQuarter,
                        targets.find((t) => t.operation === "GE")?.target,
                        true
                      )}
                    />
                  </div>
                  <button
                    className="btn-inapoi btn-primary"
                    style={{ marginTop: "1rem" }}
                    onClick={() => setSelectedQuarter(null)}
                  >
                    Back
                  </button>
                </>
              ) : selectedGraph === "Volume Produced" && chartDataVolume ? (
                <>
                  <div
                    ref={printRef}
                    className="dataCard graph"
                    style={{ height: "400px" }}
                    onClick={handlePdf}
                  >
                    <Line
                      data={chartDataVolume}
                      options={propGrafica(
                        "Volume (t)",
                        selectedQuarter,
                        targets.find((t) => t.operation === "Volume Produced")
                          ?.target,
                        true
                      )}
                    />
                  </div>
                  <button
                    className="btn-inapoi btn-primary"
                    style={{ marginTop: "1rem" }}
                    onClick={() => setSelectedQuarter(null)}
                  >
                    Back
                  </button>
                </>
              ) : selectedGraph === "Waste" && chartDataWaste ? (
                <>
                  <div
                    ref={printRef}
                    className="dataCard graph"
                    style={{ height: "400px" }}
                    onClick={handlePdf}
                  >
                    <Line
                      data={chartDataWaste}
                      options={propGrafica(
                        "Waste %",
                        selectedQuarter,
                        targets.find((t) => t.operation === "Waste")?.target,
                        true
                      )}
                    />
                  </div>
                  <button
                    className="btn-inapoi btn-primary"
                    style={{ marginTop: "1rem" }}
                    onClick={() => setSelectedQuarter(null)}
                  >
                    Back
                  </button>
                </>
              ) : selectedGraph === "Speed Loss" && chartDataSpeed ? (
                <>
                  <div
                    ref={printRef}
                    className="dataCard graph"
                    style={{ height: "400px" }}
                    onClick={handlePdf}
                  >
                    <Line
                      data={chartDataSpeed}
                      options={propGrafica(
                        "Speed Loss %",
                        selectedQuarter,
                        targets.find((t) => t.operation === "Speed Loss")
                          ?.target,
                        true
                      )}
                    />
                  </div>
                  <button
                    className="btn-inapoi btn-primary"
                    style={{ marginTop: "1rem" }}
                    onClick={() => setSelectedQuarter(null)}
                  >
                    Back
                  </button>
                </>
              ) : (
                <p>
                  Nu există date pentru {selectedGraph} în {selectedQuarter}.
                </p>
              )}
            </>
          )}
        </div>
      ) : selectedTime === "Month" && !selectedGraph ? (
        <>
          <ButtonGroup
            items={graphs}
            heading="Select KPI"
            onSelectItem={handleSelectGraph}
          />
        </>
      ) : selectedGraph === "GE" ? (
        <div className="mt-4">
          {showMonthForm ? (
            <MonthSelectionForm graphType="GE" />
          ) : !selectedMonth ? (
            <p>
              <button
                className="btn-inapoi-luna btn-primary"
                onClick={() => setShowMonthForm(true)}
              >
                Select Month
              </button>
            </p>
          ) : (
            <>
              {loading ? (
                <p>Loading...</p>
              ) : chartDataGE ? (
                <div
                  ref={printRef}
                  className="dataCard graph"
                  style={{ height: "400px" }}
                  onClick={handlePdf}
                >
                  <Line
                    data={chartDataGE}
                    options={propGrafica(
                      "GE %",
                      selectedMonth,
                      targets.find((t) => t.operation === "GE")?.target,
                      false
                    )}
                  />
                </div>
              ) : (
                <p>Nu există date pentru luna selectată.</p>
              )}

              <>
                <button
                  className="btn-inapoi-luna btn-primary"
                  onClick={() => setShowMonthForm(true)}
                >
                  Schimbă Luna
                </button>
              </>
              <>
                <button
                  className="btn-inapoi btn-primary"
                  onClick={() => setSelectedTime(null)}
                >
                  Back
                </button>
              </>
            </>
          )}
        </div>
      ) : selectedGraph === "Volume Produced" ? (
        <div className="mt-4">
          {showMonthForm ? (
            <MonthSelectionForm graphType="Volume Produced" />
          ) : !selectedMonth ? (
            <p>
              <button
                className="btn-inapoi-luna btn-primary"
                onClick={() => setShowMonthForm(true)}
              >
                Select Month
              </button>
            </p>
          ) : (
            <>
              {loading ? (
                <p>Loading...</p>
              ) : chartDataVolume ? (
                <div
                  ref={printRef}
                  className="dataCard graph"
                  style={{ height: "400px" }}
                  onClick={handlePdf}
                >
                  <Line
                    data={chartDataVolume}
                    options={propGrafica(
                      "Tones",
                      selectedMonth,
                      targets.find((t) => t.operation === "Volume Produced")
                        ?.target,
                      false
                    )}
                  />
                </div>
              ) : (
                <p>Nu există date pentru luna selectată.</p>
              )}

              <button
                className="btn-inapoi-luna btn-primary"
                onClick={() => setShowMonthForm(true)}
              >
                Schimbă Luna
              </button>
              <button
                className="btn-inapoi btn-primary"
                onClick={() => setSelectedTime(null)}
              >
                Back
              </button>
            </>
          )}
        </div>
      ) : selectedGraph === "Waste" ? (
        <div className="mt-4">
          {showMonthForm ? (
            <MonthSelectionForm graphType="Waste" />
          ) : !selectedMonth ? (
            <p>
              <button
                className="btn-inapoi-luna btn-primary"
                onClick={() => setShowMonthForm(true)}
              >
                Select Month
              </button>
            </p>
          ) : (
            <>
              {loading ? (
                <p>Loading...</p>
              ) : chartDataWaste ? (
                <div
                  ref={printRef}
                  className="dataCard graph"
                  style={{ height: "400px" }}
                  onClick={handlePdf}
                >
                  <Line
                    data={chartDataWaste}
                    options={propGrafica(
                      "Waste %",
                      selectedMonth,
                      targets.find((t) => t.operation === "Waste")?.target,
                      false
                    )}
                  />
                </div>
              ) : (
                <p>Nu există date pentru luna selectată.</p>
              )}
              <p>
                <button
                  className="btn-inapoi-luna btn-primary"
                  onClick={() => setShowMonthForm(true)}
                >
                  Schimbă Luna
                </button>
              </p>
              <button
                className="btn-inapoi btn-primary"
                onClick={() => setSelectedTime(null)}
              >
                Back
              </button>
            </>
          )}
        </div>
      ) : selectedGraph === "Speed Loss" ? (
        <div className="mt-4">
          {showMonthForm ? (
            <MonthSelectionForm graphType="Speed Loss" />
          ) : !selectedMonth ? (
            <p>
              <button
                className="btn-inapoi-luna btn-primary"
                onClick={() => setShowMonthForm(true)}
              >
                Select Month
              </button>
            </p>
          ) : (
            <>
              <p>
                <button
                  className="btn-inapoi-luna btn-primary"
                  onClick={() => setShowMonthForm(true)}
                >
                  Schimbă Luna
                </button>
              </p>

              {loading ? (
                <p>Loading...</p>
              ) : chartDataSpeed ? (
                <div
                  ref={printRef}
                  className="dataCard graph"
                  style={{ height: "400px" }}
                  onClick={handlePdf}
                >
                  <Line
                    data={chartDataSpeed}
                    options={propGrafica(
                      "%",
                      selectedMonth,
                      targets.find((t) => t.operation === "Speed Loss")?.target,
                      false
                    )}
                  />
                </div>
              ) : (
                <p>Nu există date pentru luna selectată.</p>
              )}
            </>
          )}
        </div>
      ) : selectedTime === "Specific Machine" ? (
        <div className="mt-4">
          {!selectedMachine ? (
            // Machine selection form
            <div className="row g-2 justify-content-center">
              <div className="col-md-6" style={{ margin: "2rem" }}>
                <h2 style={{ marginBottom: "3rem" }}>
                  Machine/Month Selection
                </h2>

                <div className="form-floating">
                  <select
                    className="form-select"
                    id="machineSelect"
                    value={selectedMachine}
                    onChange={(e) => {
                      const machine = e.target.value;
                      setSelectedMachine(machine);
                      if (selectedMachine && selectedMachineMonth) {
                        fetchMachineData(selectedMachine, "202509");
                      }
                    }}
                  >
                    <option value="">Machine Selection</option>
                    {machines.map((machine, index) => (
                      <option key={index} value={machine}>
                        {machine}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="machineSelect">Machine</label>
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-floating">
                  <input
                    type="month"
                    className="form-control"
                    id="machineMonthInput"
                    value={selectedMachineMonth}
                    onChange={(e) => {
                      const month = e.target.value;
                      setSelectedMachineMonth(month);
                      if (selectedMachine && month) {
                        fetchMachineData(selectedMachine, "202509");
                      }
                    }}
                  />
                  <label htmlFor="machineMonthInput">Month</label>
                </div>
              </div>
            </div>
          ) : (
            // Display chart and data
            <div>
              {loading ? (
                <p>Loading data for {selectedMachine}...</p>
              ) : chartDataMachine ? (
                <>
                  <h5>Loss Management</h5>
                  <h2 style={{ marginBottom: "1rem" }}>{selectedMachine}</h2>

                  {/* Summary Cards */}
                  {chartDataMachine && chartDataMachine.summary && (
                    <div className="row mb-4">
                      <div className="col-md-4">
                        <h5 className="card-title">Breakdowns</h5>
                        <p className="card-text h4">
                          {chartDataMachine.summary.totalBreakdowns || 0} min
                        </p>
                      </div>
                      <div className="col-md-4">
                        <h5 className="card-title">Minor Stoppages </h5>
                        <p className="card-text h4">
                          {chartDataMachine.summary.totalMinorStoppages || 0}{" "}
                          min
                        </p>
                      </div>
                      <div className="col-md-4">
                        <h5 className="card-title">Operational Losses </h5>
                        <p className="card-text h4">
                          {chartDataMachine.summary.totalOperationalLosses || 0}{" "}
                          min
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Chart */}
                  <div
                    ref={printRef}
                    className="dataCard graph"
                    style={{ height: "500px" }}
                  >
                    <Bar
                      data={chartDataMachine}
                      options={propGraficaMasina(
                        selectedMachine,
                        selectedMachineMonth
                      )}
                    />
                  </div>

                  {/* Navigation buttons */}
                  <div className="mt-3">
                    <button
                      className="btn-inapoi btn-primary me-2"
                      onClick={() => setSelectedMachine(null)}
                    >
                      Pick a different machine
                    </button>

                    <button
                      className="btn-inapoi btn-success"
                      onClick={handlePdf}
                    >
                      PDF Export
                    </button>
                  </div>
                </>
              ) : (
                <p>
                  Nu există date pentru {selectedMachine} în luna selectată.
                </p>
              )}
            </div>
          )}
        </div>
      ) : selectedInitial === "KPIs" && !selectedPosition ? (
        <>
          <ButtonGroup
            items={positions}
            heading="Select Position"
            onSelectItem={handleSelectPosition}
          />
        </>
      ) : selectedPosition === "Line Lead" ? (
        <>
          {showDateForm && (
            <>
              <h1 className="heading">Select reference date</h1>
              <>
                <form onSubmit={handleDateSubmit}>
                  <div className="row-date mb-3">
                    <input
                      type="date"
                      className="form-control"
                      id="dateInput"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                      }}
                      required
                    />
                  </div>
                  <div className="btn-date">
                    <button
                      type="submit"
                      className="btn-inapoi-imp btn-primary"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      className="btn-inapoi-imp btn-secondary"
                      onClick={() => {
                        setShowDateForm(false);
                        setSelectedInitial(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            </>
          )}
          {!showDateForm && (
            <>
              <div className="sus-line-lead">
                <div>
                  {loading ? (
                    <p>Loading...</p>
                  ) : productionPlanData.length > 0 ? (
                    renderProductionTable()
                  ) : (
                    <h2 className="eroare_productie">
                      No available data for production planning.
                    </h2>
                  )}
                </div>
                {!showBOSTable && (
                  <button
                    className="btn-bos"
                    onClick={() => setShowBOSTable(true)}
                  >
                    {" "}
                    Safety
                  </button>
                )}
                <>{showBOSTable && renderBOSTable()}</>
              </div>
              {showMonthForm ? (
                <MonthSelectionForm graphType="GE" />
              ) : loading ? (
                <p>Loading...</p>
              ) : chartDataGE ? (
                <>
                  <div
                    ref={printRef}
                    className="dataCard graph"
                    style={{ height: "400px" }}
                    onClick={handlePdf}
                  >
                    <Line
                      data={chartDataGE}
                      options={propGrafica(
                        "GE %",
                        selectedMonth || "",
                        targets.find((t) => t.operation === "GE")?.target,
                        false
                      )}
                    />
                  </div>
                  <div>
                    <Stiri jsonUrl={`http://${path}:5000/news`} path={path} />
                  </div>
                </>
              ) : (
                <>
                  <button
                    className="btn-inapoi btn-primary"
                    onClick={() => setShowMonthForm(true)}
                  >
                    Afișează Grafic GE
                  </button>
                  <p>Apasă butonul pentru a afișa graficul GE.</p>
                </>
              )}
            </>
          )}
        </>
      ) : selectedPosition === "Section Manager" ? (
        <div className="mt-4">
          <h2 style={{ margin: "3rem" }}>
            Log Viewer - Section Manager Production
          </h2>

          {showLogDateForm ? (
            <div className="row-date g-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (selectedLogDate) {
                    fetchSectionManagerProductionData(selectedLogDate);
                    setShowLogDateForm(false);
                  }
                }}
              >
                <div className="row-date mb-3">
                  <input
                    type="date"
                    className="form-control"
                    id="logDateInput"
                    value={selectedLogDate || ""}
                    onChange={(e) => setSelectedLogDate(e.target.value)}
                    required
                  />
                </div>
                <div className="btn-date">
                  <button type="submit" className="btn-inapoi-imp btn-primary">
                    Confirm
                  </button>
                  <button
                    type="button"
                    className="btn-inapoi-imp btn-secondary"
                    onClick={() => {
                      setShowLogDateForm(false);
                      setSelectedLogViewer(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : logViewerData.length > 0 ? (
            <>
              {renderProductionLogTable()}
              <div className="row-date mb-3">
                <button
                  className="btn-inapoi btn-primary"
                  onClick={() => setShowLogDateForm(true)}
                >
                  Schimbă Data
                </button>
                <button
                  className="btn-inapoi btn-secondary"
                  onClick={() => {
                    setSelectedLogViewer(null);
                    setLogViewerData([]);
                    setSelectedPosition(null);
                  }}
                >
                  Back
                </button>
              </div>
            </>
          ) : (
            <>
              <h4 style={{ margin: "2rem", color: "#ccca" }}>
                Pick a reference date for production plan .
              </h4>
              <button
                className="btn-inapoi btn-primary"
                onClick={() => setShowLogDateForm(true)}
              >
                Select reference date
              </button>
            </>
          )}
        </div>
      ) : selectedDataset === "addRaport" ? (
        <div className="mt-4">
          <h3>Formular Raport Nou</h3>
          <div className="row g-2">
            <div className="col-md">
              <div className="form-floating">
                <input
                  type="time"
                  className="form-control"
                  id="oraIn"
                  value={newRaport.oraIn}
                  onChange={(e) =>
                    setNewRaport({ ...newRaport, oraIn: e.target.value })
                  }
                />
                <label htmlFor="oraIn">Ora Începere</label>
              </div>
            </div>

            <div className="col-md">
              <div className="form-floating">
                <input
                  type="time"
                  className="form-control"
                  id="oraOut"
                  value={newRaport.oraOut}
                  onChange={(e) =>
                    setNewRaport({ ...newRaport, oraOut: e.target.value })
                  }
                />
                <label htmlFor="oraOut">Ora Sfârșit</label>
              </div>
            </div>

            <div className="col-md">
              <div className="form-floating">
                <select
                  className="form-select"
                  id="zonaSelect"
                  value={newRaport.zona}
                  onChange={(e) =>
                    setNewRaport({ ...newRaport, zona: e.target.value })
                  }
                >
                  <option value="">Select</option>
                  <option value="1">L1</option>
                  <option value="2">L2</option>
                  <option value="3">L3</option>
                </select>
                <label htmlFor="zonaSelect">Zona</label>
              </div>
            </div>

            <div className="col-md">
              <div className="form-floating">
                <select
                  className="form-select"
                  id="tipSelect"
                  value={newRaport.tip}
                  onChange={(e) =>
                    setNewRaport({ ...newRaport, tip: e.target.value })
                  }
                >
                  <option value="">Select</option>
                  <option value="Unplanned">Unplanned</option>
                  <option value="Planned">Planned</option>
                </select>
                <label htmlFor="tipSelect">Tip</label>
              </div>
            </div>

            {newRaport.tip === "Planned" && (
              <div className="col-md">
                <div className="form-floating">
                  <select
                    className="form-select"
                    id="tipSelectPlanned"
                    value={newRaport.tipSecundar || ""}
                    onChange={(e) =>
                      setNewRaport({
                        ...newRaport,
                        tipSecundar: e.target.value,
                      })
                    }
                  >
                    <option value="">Select</option>
                    <option value="Changeover">Changeover</option>
                    <option value="Sanitation">Sanitation</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Autonomous Maintenance">
                      Autonomous Maintenance
                    </option>
                    <option value="Stops">Stops</option>
                    <option value="Consumables replacement">
                      Consumables replacement
                    </option>
                    <option value="Start and Finish Production">
                      Start and Finish Production
                    </option>
                  </select>
                  <label htmlFor="tipSelectPlanned">Motiv</label>
                </div>
              </div>
            )}

            {newRaport.tip === "Unplanned" && (
              <div className="col-md">
                <div className="form-floating">
                  <select
                    className="form-select"
                    id="tipSelectUnplanned"
                    value={newRaport.tipSecundar || ""}
                    onChange={(e) =>
                      setNewRaport({
                        ...newRaport,
                        tipSecundar: e.target.value,
                      })
                    }
                  >
                    <option value="">Select</option>
                    <option value="Breakdowns">Breakdowns</option>
                    <option value="Stoppage">Stoppage</option>
                    <option value="Operational Losses">
                      Operational Losses
                    </option>
                    <option value="Line Delays">Line Delays</option>
                    <option value="Labor Management Losses">
                      Labor Management Losses
                    </option>
                  </select>
                  <label htmlFor="tipSelectUnplanned">Motiv</label>
                </div>
              </div>
            )}

            {(newRaport.tip === "Unplanned" ||
              (newRaport.tip === "Planned" &&
                (newRaport.tipSecundar === "Sanitation" ||
                  newRaport.tipSecundar === "Maintenance" ||
                  newRaport.tipSecundar === "Stops"))) && (
              <div className="col-md">
                <div className="form-floating">
                  <input
                    type="text"
                    className="form-control"
                    id="masina"
                    value={newRaport.masina}
                    onChange={(e) =>
                      setNewRaport({ ...newRaport, masina: e.target.value })
                    }
                  />
                  <label htmlFor="masina">Mașina</label>
                </div>
              </div>
            )}

            {(newRaport.tip === "Unplanned" ||
              (newRaport.tip === "Planned" &&
                (newRaport.tipSecundar === "Sanitation" ||
                  newRaport.tipSecundar === "Maintenance" ||
                  newRaport.tipSecundar === "Stops"))) && (
              <div className="col-md">
                <div className="form-floating">
                  <input
                    type="text"
                    className="form-control"
                    id="ansamblu"
                    value={newRaport.ansamblu}
                    onChange={(e) =>
                      setNewRaport({ ...newRaport, ansamblu: e.target.value })
                    }
                  />
                  <label htmlFor="ansamblu">Ansamblu</label>
                </div>
              </div>
            )}

            {(newRaport.tip === "Unplanned" ||
              (newRaport.tip === "Planned" &&
                (newRaport.tipSecundar === "Sanitation" ||
                  newRaport.tipSecundar === "Maintenance" ||
                  newRaport.tipSecundar === "Stops"))) && (
              <div className="col-md">
                <div className="form-floating">
                  <input
                    type="text"
                    className="form-control"
                    id="problema"
                    value={newRaport.problema}
                    onChange={(e) =>
                      setNewRaport({ ...newRaport, problema: e.target.value })
                    }
                  />
                  <label htmlFor="problema">Problema</label>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3">
            <button
              className="btn btn-group-vertical-item"
              onClick={handleSaveRaport}
            >
              Save Raport
            </button>
            <button
              className="btn btn-group-vertical-item"
              onClick={() => setSelectedDataset(null)}
            >
              Back
            </button>
          </div>
        </div>
      ) : !selectedDataset && selectedInitial === "KPIs" ? (
        <>
          {showDateForm && (
            <>
              <h1 className="heading">Select reference date</h1>
              <>
                <form onSubmit={handleDateSubmit}>
                  <div className="row-date mb-3">
                    <input
                      type="date"
                      className="form-control"
                      id="dateInput"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                      }}
                      required
                    />
                  </div>
                  <>
                    <div className="btn-date">
                      <button
                        type="submit"
                        className="btn-inapoi-imp btn-primary"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        className="btn-inapoi-imp btn-secondary"
                        onClick={() => {
                          setShowDateForm(false);
                          setSelectedInitial(null);
                          setSelectedPosition(null);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                </form>
              </>
            </>
          )}
          {!showDateForm && (
            <ButtonGroup
              items={items}
              heading={`Seturi de date pentru ${selectedPosition}`}
              onSelectItem={handleSelectItem}
            />
          )}
        </>
      ) : selectedDataset === "Loss Management" ? (
        <>
          <ButtonGroup
            items={loss}
            heading={`Loss Management`}
            onSelectItem={handleSelectItem}
          />
        </>
      ) : selectedDataset === "Stops" ? (
        <>
          <ButtonGroup
            items={rapoarte}
            heading={`Line Stoppage Management`}
            onSelectItem={handleSelectItem}
          />
        </>
      ) : selectedInitial === "DMS Action Table" ? (
        <div className="mt-4">
          <h2 style={{ margin: "3rem" }}>DMS Action Table</h2>
          {loading ? <p>Loading...</p> : renderDMSActionTable()}
        </div>
      ) : (
        <></>
      )}

      {loading && <p>Loading...</p>}

      {selectedDataset &&
        !loading &&
        (cardsData.length > 0 || comparisonDates.length > 0) && (
          <div className="mt-4">
            {selectedDataset === "Vezi Rapoarte" ? (
              renderReportsTable()
            ) : selectedDataset === "GE & Stats" &&
              selectedPosition === "Process Engineer" ? (
              // New comparison view for Process Engineer GE & Stats
              <>
                {/* Display comparison data */}
                <div className="comparison-container">
                  {comparisonDates.map((date, dateIndex) => (
                    <div key={date} className="date-comparison-section">
                      {/* Date Header with Remove Button */}
                      <div className="d-flex justify-content-between align-items-center ">
                        <h4 className="date-header">
                          {date}
                          {dateIndex === 0 && (
                            <span className="badge bg-primary ms-5">
                              Original
                            </span>
                          )}
                        </h4>
                        {dateIndex > 0 && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleRemoveComparisonDate(date)}
                          >
                            Șterge
                          </button>
                        )}
                      </div>

                      {/* Cards for this date */}
                      <div
                        className="d-flex justify-content-center align-items-center flex-wrap"
                        style={{
                          padding: "1rem",
                          borderRadius: "1rem",
                        }}
                      >
                        {comparisonCardsData[date]?.map((card, index) => (
                          <div
                            className="card text-bg-primary mb-3 me-3"
                            style={{
                              maxWidth: "18rem",
                              minWidth: "16rem",
                            }}
                            key={`${date}-${index}`}
                          >
                            <div className="card-header fw-bold">
                              {card.header}
                            </div>
                            <div className="card-body">
                              <p
                                className="card-text"
                                style={{ whiteSpace: "pre-wrap" }}
                              >
                                {card.text}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Date Button */}
                <div className="text-center" style={{ padding: "2rem" }}>
                  {!showDateInput ? (
                    <button
                      className="btn-inapoi btn-primary"
                      onClick={() => setShowDateInput(true)}
                    >
                      Add comparasion data
                    </button>
                  ) : (
                    <div className="date-selection-container">
                      <h3 className="mb-3">Select reference date</h3>
                      <form
                        onSubmit={handleDateSubmit}
                        className="d-flex justify-content-center align-items-center gap-3"
                        style={{ flexDirection: "column" }}
                      >
                        <>
                          {" "}
                          <div className="row-date">
                            <input
                              type="date"
                              className="form-control"
                              id="dateInput"
                              value={selectedDate}
                              onChange={(e) => {
                                setSelectedDate(e.target.value);
                              }}
                              required
                            />
                          </div>
                        </>

                        <>
                          <div className="btn-date d-flex gap-2">
                            <button
                              type="submit"
                              className="btn-inapoi-imp btn-primary"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              className="btn-inapoi-imp btn-secondary"
                              onClick={() => {
                                setShowDateInput(false);
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      </form>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Original view for other datasets
              <>
                <div
                  className="d-flex justify-content-center align-items-center flex-wrap"
                  style={{
                    minHeight: "50vh",
                    padding: "2rem",
                    borderRadius: "1rem",
                  }}
                >
                  {cardsData.map((card, index) => (
                    <div
                      className="card text-bg-primary mb-3"
                      style={{ maxWidth: "18rem" }}
                      key={index}
                      onClick={() => handleComments(index)}
                    >
                      <div className="card-header fw-bold">
                        {card.header || newRaport.tip}
                      </div>
                      <div className="card-body">
                        <p
                          className="card-text"
                          style={{ whiteSpace: "pre-wrap" }}
                        >
                          {card.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Keep original date selection for other cases */}
                {showDateForm && (
                  <>
                    <h1 className="heading">Select reference date</h1>
                    <>
                      <form onSubmit={handleDateSubmit}>
                        <div className="row-date mb-3">
                          <input
                            type="date"
                            className="form-control"
                            id="dateInput"
                            value={selectedDate}
                            onChange={(e) => {
                              setSelectedDate(e.target.value);
                            }}
                            required
                          />
                        </div>
                        <div className="btn-date">
                          <button
                            type="submit"
                            className="btn-inapoi-imp btn-primary"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            className="btn-inapoi-imp btn-secondary"
                            onClick={() => {
                              setShowDateForm(false);
                              setSelectedInitial(null);
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </>
                  </>
                )}
              </>
            )}
          </div>
        )}
    </div>
  );
}

export default App;
