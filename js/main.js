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
            console.log('loading')
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
            var elemTop = document.querySelector(elem).offsetTop;
            var elemBottom = elemTop + document.querySelector(elem).clientHeight;
            return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
          };
          let respond_to_scroll = function () {
            //console.log("description:" +   + " visualisation1: " + view_checks('#visualisation1') + " visualisation2: " + view_checks('#visualisation2'))
            a_description.className = "";
            a_visualisation1.className = "";
            a_visualisation2.className = "";
            if (view_checks('#description')) {a_description.className = "selected"}
            if (view_checks('#visualisation1')) {a_visualisation1.className = "selected"}
            if (view_checks('#visualisation2')) {a_visualisation2.className = "selected"}

          };
          let init = function() {
            respond_to_scroll();
            window.addEventListener("scroll", respond_to_scroll);
          };
          return init;
        },
        //init the the event binding the actions to the burger
        init: function () {
            console.log('ready')
            //make scrolling binds
            main_app.nav_bind()();
            main_app.anchor_bind()();
        }
    }
    //launch the application which binds the buttons once window is loaded
    window.addEventListener("load", function(){
          main_app.init();
    });;

})();
