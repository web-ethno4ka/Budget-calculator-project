// Budget Controller
var budgetController = (function() {

    var Expense = function(id, description, value) {     // function contructor
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };

    Expense.prototype.calcPercentage = function(totalIncome) {
        if (totalIncome > 0) {
            this.percentage = Math.round((this.value / totalIncome) * 100);
        } else {
            this.percentage = -1;
        }
    };

    Expense.prototype.getPercentage = function() {
        return this.percentage;
    }

    var Income = function(id, description, value) {      // function contructor
        this.id = id;
        this.description = description;
        this.value = value;
    };

    var calculateTotal = function(type) {       // type ==> expenses or incomes
        var sum = 0;
        data.allItems[type].forEach(function(cur) {     // cur ==> current value of the array;  
            sum += cur.value;                      // getting sum of expenses or incomes (depends on type)
        });
        data.totals[type] = sum;    // pass the results into data-object for storing
    }


    var data = {
        allItems: {
            exp: [],
            inc: []
        },
        totals: {
            exp: 0,
            inc: 0
        },
        budget: 0,
        percentage: -1
    }; 

    return {
        addItem: function(type, des, val) {
            var newItem, ID;

            // Create new ID
            if (data.allItems[type].length > 0) {
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
            } else {
                ID = 0;
            }

            // Create new item based on 'inc' or 'exp' type
            if (type === 'exp') {
                newItem = new Expense(ID, des, val);
            } else if (type === 'inc') {
                newItem = new Income(ID, des, val);
            }

            // Push it into our data structure
            data.allItems[type].push(newItem);

            // Return the new element
            return newItem;
        },


        deleteItem: function(type, id) {
            var ids, index;

            //  id = 6
            //  data.allItems[type][id];
            //  ids = [1 2 4 6 8]
            //  index = 3

            var ids = data.allItems[type].map(function(current)   {   // .map returns a new array
                return current.id;
            });

            index = ids.indexOf(id);    // .indexOf returnes the index number of the element of the array (id)

            if (index !== -1) {    // index can be equal -1 in case that this item is not found in the array 
                data.allItems[type].splice(index, 1);   // spl start deleting '1' element from the 'index'-position
            }
        },

        calculateBudget: function() {

            // Calculate total income and expenses
            calculateTotal('exp');
            calculateTotal('inc');

            // Calculate the budget: income - expenses
            data.budget = data.totals.inc - data.totals.exp;

            // Calculate the percentage of income that we spent ==> (exp / inc)*100 
            if (data.totals.inc > 0) {          // because the result */0 caused the infinity-result of the percentage
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);      //   take only integer part of a number using Math.round()
            } else {
                data.percentage = -1;
            }
        },

        calculatePercentages: function() {

            data.allItems.exp.forEach(function(cur) {
                cur.calcPercentage(data.totals.inc);
            });
        },

        getPercentages: function() {
            var allPerc = data.allItems.exp.map(function(cur) {     // Create a new array (using map) with all expense percentages
                return cur.getPercentage();
            });
            return allPerc;
        },


        getBudget: function() {
            return {                            // if we need to return several values we gonna use an objects 
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage
            }    
        },

        testing: function() {           // testing-function for console
            console.log(data); 
        }
    };

})();



// UI Controller
var UIController = (function() {


    // object with css-classes that we use in our code (if we'll want to rename our css-classes in the future it will not impact onto our code)
    var DOMstrings = {          
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputBtn: '.add__btn',
        incomeContainer: '.income__list',
        expensesContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expensesLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        container: '.container',
        expensesPercLabel: '.item__percentage',
        dateLabel: '.budget__title--month'
    };


    var formatNumber = function(num, type) {
        var numSplit, int, dec;

        /*
        + or - before number, exactly 2 decimal points, comma separating the thousands
        
        2310.4567 ->  + 2,310.46
        2000 ->  + 2,000.00
        */

        num = Math.abs(num);    // removes the sign of the number
        num = num.toFixed(2);

        numSplit = num.split('.');   // divide our number into 2 parts (the integer and decimal) and it will be stored in an array 

        int = numSplit[0];
        if (int.length > 3) {       // then the number > 1000 => need the comma
            int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, 3);  // select 1st part of string beginning from 0-index, adding comma 
                                                                    // adding 2nd part of string (3 symbols) beginning from int.length-3 
                                                                    // input 23510 ==> output 23,510
        } 

        dec = numSplit[1];

        // type === 'exp' ? sign = '-' : sign = '+';   // ternary operator == > if - then - else

        return (type === 'exp' ? '-' : '+') + ' ' + int + '.' + dec;   // return our number with the sign and decimals

    };


    var nodeListForEach = function(list, callback) {        // a peace of reusable code that we can use for the NodeLists (in diff projects)
                                                             // our own forEach-loop that in each iteration calls callback function 
        for (var i = 0; i < list.length; i++) {
            callback(list[i], i);
        }
    };


    // exposing into the public
    return {                                 
        getInput: function() {
            return {
                type: document.querySelector(DOMstrings.inputType).value,   // will be either inc or exp
                description: document.querySelector(DOMstrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMstrings.inputValue).value) 
            };
        },

        addListItem: function(obj, type) {
            var html, newHtml, element;

            // Create HTML strings with placeholder text
            if(type === 'inc') {
                element = DOMstrings.incomeContainer;

                html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            } else if (type === 'exp') {
                element = DOMstrings.expensesContainer;

                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }

            // Replace the placeholder text with some actual data
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));

            // Insert the HTML into the DOM (as the last element into the list)
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml); 
        },


        deleteListItem: function(selectorID) {
            var el = document.getElementById(selectorID);
            el.parentNode.removeChild(el);
        },

        clearFields: function() {      // Clearing input-fields
            var fields, fieldsArr;
            
            fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);

            // Converting list into array using array-method (slice)
            fieldsArr = Array.prototype.slice.call(fields);

            fieldsArr.forEach(function(current, index, array) {     // Current value of the array, index-number [0 .. n-1], array itself
                current.value = "";                // Clearing input-fields
            });
            fieldsArr[0].focus();       // the first input (description) is focus on 
        },

        displayBudget: function(obj) {
            var type;
            obj.budget > 0 ? type = 'inc' : type = 'exp';

            document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(obj.budget, type);
            document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
            document.querySelector(DOMstrings.expensesLabel).textContent = formatNumber(obj.totalExp, 'exp');

            if (obj.percentage > 0) {
                document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage + '%';
            } else {
                document.querySelector(DOMstrings.percentageLabel).textContent = '---';
            }
        },


        displayPercentages: function(percentages) {
            var fields = document.querySelectorAll(DOMstrings.expensesPercLabel);      // returns a NodeList of the expenses percentages

            nodeListForEach(fields, function(current, index) {      // 'fields' -- list, 'function(current, index)' -- callback

                if (percentages[index] > 0) {
                    current.textContent = percentages[index] + '%';
                } else {
                    current.textContent = '---';
                }
            });
        },


        displayMonth: function() {
            var now, months,  month, year;

            now = new Date();
            //  var christmas = new Date(2018, 11, 25);

            months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            
            month = now.getMonth();
            year = now.getFullYear();
            document.querySelector(DOMstrings.dateLabel).textContent = months[month] + ' ' + year;
        },

        changedType: function() {

            var fields = document.querySelectorAll(
                DOMstrings.inputType + ',' +
                DOMstrings.inputDescription + ',' +
                DOMstrings.inputValue);             // returns the NodeList -> so we can use our own nodeListForEach method


            nodeListForEach(fields, function(cur) {
                cur.classList.toggle('red-focus');  //  'toggle' adds needed class when its not there/ and when its there --> removes it
            });

            document.querySelector(DOMstrings.inputBtn).classList.toggle('red');    // changes 'add'-button class to the 'red' (red colored)
        },


        getDOMstrings: function() {
            return DOMstrings;                   // exposing DOMstrings-object into the public
        }
    };

})();


// Global APP Controller
var controller = (function(budgetCtrl, UICtrl) {        // Immediately Invoked Function Expression (IIFE) ==> for data privacy

    var setupEventListeners = function() {      //  this code should run when app starts working ==> controller.init();
        var DOM = UICtrl.getDOMstrings();

        document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);

        document.addEventListener('keypress', function(event) {
            if (event.keyCode === 13 || event.which === 13 )  {
                ctrlAddItem();
            }
        });

        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);   // putting the event handler to the parent element (for expenses and income)
    
        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);  // change border-color for inputs ('exp' -> red)
    };


    var updateBudget = function() {

        // 1. Calculate the budget 
        budgetCtrl.calculateBudget();

        // 2. Return the budget
        var budget = budgetCtrl.getBudget();

        // 3. Display the budget on the UI
        UICtrl.displayBudget(budget);
    }


    var updatePercentages = function() {

        //  1. Calculate percentages
        budgetCtrl.calculatePercentages();

        //  2. Read percentages from the budget controller
        var percentages = budgetCtrl.getPercentages();

        //  3. Update the UI with the new percentages
        UICtrl.displayPercentages(percentages);
    }; 


    var ctrlAddItem = function() {              // Called each time that we input a new element
        var input, newItem;

        // 1. Get the field input data
        var input = UICtrl.getInput();

        if (input.description !== "" && !isNaN(input.value) && input.value > 0) {    // condition for adding the items into the list
            
            // 2. Add the item to Budget controller
            var newItem = budgetCtrl.addItem(input.type, input.description, input.value);

            // 3. Add the item to the UI
            UICtrl.addListItem(newItem, input.type);

            // 4. Clear the fields
            UICtrl.clearFields();

            // 5. Calculate and update budget
            updateBudget();

            // 6. Calculate and update percentages
            updatePercentages();
        }

    };


    var ctrlDeleteItem = function(event) {
        var itemID, splitID, type, ID;
        
        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;    // moving up in the DOM (to the needed parent element) to get ID  

        if (itemID) {

            // inc-1 
            splitID = itemID.split('-');
            type = splitID[0];
            ID = parseInt(splitID[1]);      // convert the string to integer

            //  1. Delete the Item from the data structure
            budgetCtrl.deleteItem(type, ID);

            //  2. Delete the item from the UI
            UICtrl.deleteListItem(itemID);

            //  3. Update and show the new budget
            updateBudget();

            // 4. Calculate and update percentages
            updatePercentages();
        }

    };


    return {                                // exposing into the public
        init: function() {
            console.log('App has started');
            UICtrl.displayMonth();
            UICtrl.displayBudget({           // reset all the values (to zero) with launching the app
                budget: 0,
                totalInc: 0,
                totalExp: 0,
                percentage: -1
            });       
            setupEventListeners();
        }
    }

})(budgetController, UIController);         // passing the parameters into IIFE


controller.init();