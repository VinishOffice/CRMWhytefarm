function modalHide() {
    // alert("foundddddddddddddd")
    $(".modal").modal('hide');
}

function modelshow() {
    // alert("foundddddddddddddd")
    $(".modal").modal('show');
}

function modalHideHub() {
    // alert("foundddddddddddddd")
    $(".hub").modal('hide');
}

function modelshowHub() {
    // alert("foundddddddddddddd")
    $(".hub").modal('show');
}

function usermodalHide() {
    // alert("foundddddddddddddd")
    $(".um").modal('hide');
}

function usermodelshow() {
    // alert("foundddddddddddddd")
    $(".um").modal('show');
}

function locationmodalHide() {
    // alert("foundddddddddddddd")
    $(".lm").modal('hide');
}

function locationmodelshow() {
    // alert("foundddddddddddddd")
    $(".lm").modal('show');
}

function locationTmodalHide() {
    // alert("foundddddddddddddd")
    $(".tl").modal('hide');
}

function locationTmodelshow() {
    // alert("foundddddddddddddd")
    $(".tl").modal('show');
}


function locationTHmodalHide() {
    // alert("foundddddddddddddd")
    $(".tlh").modal('hide');
}

function locationTHmodelshow() {
    // alert("foundddddddddddddd")
    $(".tlh").modal('show');
}

function locationTHmodalloma() {
    // alert("foundddddddddddddd")
    $(".loma").modal('hide');
}

function locationTHmodelshowloma() {
    // alert("foundddddddddddddd")
    $(".loma").modal('show');
}


// ==================================== customerssss modal

function customerWalletopen() {
    // alert("foundddddddddddddd")
    $(".cw").modal('show');
}

function customerWalletclose() {
    // alert("foundddddddddddddd")
    $(".cw").modal('hide');
}


function customerCredittopen() {
    // alert("foundddddddddddddd")
    $(".cc").modal('show');
}

function customerCreditclose() {
    // alert("foundddddddddddddd")
    $(".cc").modal('hide');
}

function customerCredittopenFromCheckout() {
    // alert("foundddddddddddddd")
    $(".creditcheckout").modal('show');
}

function customerCreditcloseFromCheckout() {
    // alert("foundddddddddddddd")
    $(".creditcheckout").modal('hide');
}

function customerDFopen() {
    // alert("foundddddddddddddd")
    $(".df").modal('show');
}

function customerDFclose() {
    // alert("foundddddddddddddd")
    $(".df").modal('hide');
}

function customerCashopen() {
    // alert("foundddddddddddddd")
    $(".cash").modal('show');
}

function customerCashclose() {
    // alert("foundddddddddddddd")
    $(".cash").modal('hide');
}

function customerSRLopen() {
    // alert("foundddddddddddddd")
    $(".srl").modal('show');
}

function customerSRLclose() {
    // alert("foundddddddddddddd")
    $(".srl").modal('hide');
}

function customerVacationopen() {
    // alert("foundddddddddddddd")
    $(".vacation").modal('show');
}

function customerVacationclose() {
    // alert("foundddddddddddddd")
    $(".vacation").modal('hide');
}

function customerTicketsopen() {
    // alert("foundddddddddddddd")
    $(".tickets").modal('show');
}

function customerTicketsclose() {
    // alert("foundddddddddddddd")
    $(".tickets").modal('hide');
}

function customerSubscriptionopen() {
    // alert("foundddddddddddddd")
    $(".subscription").modal('show');
}

function customerSubscriptionclose() {
    // alert("foundddddddddddddd")
    $(".subscription").modal('hide');
}

function customerIntervalopen() {
    // alert("foundddddddddddddd")
    $(".interval").modal('show');
}

function customerIntervalclose() {
    // alert("foundddddddddddddd")
    $(".interval").modal('hide');
}


function customerCalendarlopen() {
    // alert("foundddddddddddddd")
    $(".calendar").modal('show');
}

function customerCalendarlclose() {
    // alert("foundddddddddddddd")
    $(".calendar").modal('hide');
}


function bqlopen() {
    // alert("foundddddddddddddd")
    $(".bq").modal('show');
}

function bqlclose() {
    // alert("foundddddddddddddd")
    $(".bq").modal('hide');
}

function mdlvopen() {
    // alert("foundddddddddddddd")
    $(".mdlv").modal('show');
}

function mdlvclose() {
    // alert("foundddddddddddddd")
    $(".mdlv").modal('hide');
}

function pausesubdialogopen() {
    // alert("foundddddddddddddd")
    $(".resumedatesub").modal('show');
}

function pausesubdialogclose() {
    // alert("foundddddddddddddd")
    $(".resumedatesub").modal('hide');
}



function openEditOrder() {

    $(".orderedit").modal('show');
}

function closeEditOrder() {

    $(".orderedit").modal('hide');
}

function seditopen() {
    // alert("foundddddddddddddd")
    $(".subedit").modal('show');
}

function seditclose() {
    // alert("foundddddddddddddd")
    $(".subedit").modal('hide');
}
function orderData(productNames, productQuantities) {
    $(document).ready(function () {
        setTimeout(function () {
            var ctx2 = document.getElementById("monthlyOrderChart");
            if (ctx2 !== null) {
                ctx2 = ctx2.getContext('2d');
                var currentDate = new Date();
                var currentMonth = currentDate.getMonth();
                var currentYear = currentDate.getFullYear();
                var daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

                function getOrdinal(day, month) {
                    var monthNames = [
                        "Jan", "Feb", "Mar",
                        "Apr", "May", "June", "July",
                        "Aug", "Sept", "Oct",
                        "Nov", "Dec"
                    ];
                    return day + "-" + monthNames[month];
                }

                var labels = [];
                for (var i = 1; i <= daysInMonth; i++) {
                    labels.push(getOrdinal(i, currentMonth));
                }

                var datasets = [];
                for (var i = 0; i < productNames.length; i++) {
                    datasets.push({
                        label: productNames[i],
                        data: productQuantities.map(q => q[i] || 0), // Ensure all data points are mapped correctly
                        backgroundColor: 'rgba(' + Math.floor(Math.random() * 256) + ',' + Math.floor(Math.random() * 256) + ',' + Math.floor(Math.random() * 256) + ', 0.2)',
                        borderColor: 'rgba(' + Math.floor(Math.random() * 256) + ',' + Math.floor(Math.random() * 256) + ',' + Math.floor(Math.random() * 256) + ', 1)',
                        borderWidth: 1
                    });
                }

                console.log("Labels: ", labels);
                console.log("Datasets: ", datasets);

                var orderData = {
                    labels: labels,
                    datasets: datasets
                };

                var salesOptions = {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            }
                        }]
                    },
                    legend: {
                        display: false
                    },
                    tooltips: {
                        mode: 'index',
                        intersect: false
                    },
                    hover: {
                        mode: 'nearest',
                        intersect: true
                    }
                };

                var salesChart = new Chart(ctx2, {
                    type: 'line',
                    data: orderData,
                    options: salesOptions
                });

                var legend = document.getElementById('monthly-order-legend');
                orderData.datasets.forEach(function (dataset) {
                    var item = document.createElement('div');
                    item.classList.add('legend-item');
                    item.style.backgroundColor = dataset.backgroundColor;
                    item.style.borderColor = dataset.borderColor;
                    item.textContent = dataset.label;
                    item.addEventListener('click', function () {
                        var meta = salesChart.getDatasetMeta(orderData.datasets.indexOf(dataset));
                        meta.hidden = !meta.hidden;
                        salesChart.update();
                        item.classList.toggle('strikethrough');
                    });
                    item.style.marginRight = '10px';
                    item.style.marginTop = '1rem';
                    item.style.cursor = "pointer";
                    legend.appendChild(item);
                });
            } else {
                console.error('Element with id "monthlyOrderChart" not found.');
            }
        }, 100);
    });
}
