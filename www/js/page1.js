// global var
var origin;
var destination;
var mileage;
var capacity;

// methods
function getData() {
    origin = $( 'input[id=origin]').val();
    destination = $( 'input[id=destination]').val();
    mileage = $( 'input[id=mileage]').val();
    capacity = $( 'input[id=capacity]').val();

    console.log(origin);
    console.log(destination);
    console.log(mileage);
    console.log(capacity);
}