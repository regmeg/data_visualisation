//self invocing function
(function () {
    "use strict";
    //create a for makiung sticky navigation
    let main_app = {
        //define the function for navigation binding
        nav_bind: function () {
          let _this = this;
          let header = document.querySelector('header');
          let nav = document.querySelector('nav');
          let respond_to_scroll = function () {
            if (window.scrollY > header.clientHeight) {
                nav.style.position = "fixed";
                nav.style.top = 0;
                nav.style.width = '100%';
            } else {
                nav.style.position = "relative";

            }
          }
          let init = function() {
            respond_to_scroll()
            window.addEventListener("scroll", respond_to_scroll);
          };
          return init;
        },
        //define function for smooth scroll jump
        anchor_bind: function () {
          let _this = this;
          let a_description = document.querySelector('#description_a');
          let a_visualisation1 = document.querySelector('#visualisation1_a');
          let a_visualisation2 = document.querySelector('#visualisation2_a');
          //check if the element is in the view
          let view_checks = function (elem) {
            let docViewTop = window.scrollY;
            let docViewBottom = docViewTop + window.innerHeight;
            let docsize = docViewBottom - docViewTop;
            var elemTop = document.querySelector(elem).offsetTop;
            var elemBottom = elemTop + document.querySelector(elem).clientHeight;
            let elemsize = elemBottom - elemTop;
            let prcn_in = 0;
            let fully_in = (elemBottom <= docViewBottom) && (elemTop >= docViewTop);
            let partly_in = ((elemTop >= docViewTop) && (elemTop <= docViewBottom)) || ((elemBottom >= docViewTop) && (elemBottom <= docViewBottom))
            if (partly_in) {
              if ((elemTop >= docViewTop) && (elemTop <= docViewBottom)) prcn_in = (docViewBottom - elemTop) / elemsize
              if ((elemBottom >= docViewTop) && (elemBottom <= docViewBottom))  prcn_in = (elemBottom - docViewTop) / elemsize
              if (fully_in) prcn_in = 1;
            }
            if ((elemsize >= docsize) && !partly_in) {
              partly_in = (elemBottom >= docViewBottom) && (elemTop <= docViewTop)
              if (partly_in) prcn_in = 1;
            }
            return [partly_in, prcn_in];
          };
          let respond_to_scroll = function () {
            a_description.className = "";
            a_visualisation1.className = "";
            a_visualisation2.className = "";
            let ar1 = view_checks('#description');
            let in1 = ar1[0]
            let prc1 = ar1[1]
            let ar2 = view_checks('#visualisation1');
            let in2 = ar2[0]
            let prc2 = ar2[1]
            let ar3 = view_checks('#visualisation2');
            let in3 = ar3[0]
            let prc3 = ar3[1]
            if (in1 && prc1 > prc2) {a_description.className = "selected"}
            if (in2 && (prc1 <= prc2) && (prc2 - 0.1 >= prc3)) {a_visualisation1.className = "selected"}
            if (in3 && (prc3 > prc2 - 0.1)) {a_visualisation2.className = "selected"}

          };
          let init = function() {
            respond_to_scroll();
            window.addEventListener("scroll", respond_to_scroll);
          };
          return init;
        },
        //init the the event binding the actions to the burger
        init: function () {
            main_app.nav_bind()();
            main_app.anchor_bind()();
        }
    }
    //launch the application which binds the buttons once window is loaded
    window.addEventListener("load", function(){
          main_app.init();
    });;

})();
