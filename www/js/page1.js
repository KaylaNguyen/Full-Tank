// global var
var origin;
var destination;
var mileage;
var capacity;

// methods
function test(){
	console.log("hi");
}

function sendData() {
    var origin = $( 'input[id=origin]').val();
    var destination = $( 'input[id=destination]').val();
    var mileage = $( 'input[id=mileage]').val();
    var capacity = $( 'input[id=capacity]').val();

    var packedData = origin+","+destination+","+mileage+","+capacity;

	window.location.replace("page2.html?" + packedData);
}