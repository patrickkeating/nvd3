
/*****
 * A no-frills tooltip implementation.
 *****/


(function() {

  window.nv.tooltip = {};

  /* Model which can be instantiated to handle tooltip rendering.
  */
  window.nv.models.tooltip = function() {
        var nvtooltip = {};

        var content = null    //HTML contents of the tooltip.  If null, the content is generated via the data variable.
        ,   data = null     /* Tooltip data. If data is given in the proper format, a consistent tooltip is generated.
        Format of data:
        {
            key: "Date",
            value: "August 2009",
            series: [
                    {
                        key: "Series 1",
                        value: "Value 1"
                    },
                    {
                        key: "Series 2",
                        value: "Value 2"
                    }
            ]

        }

        */
        ,   gravity = 's'   //Can be 'n','s','e','w'. Determines how tooltip is positioned.
        ,   distance = 20   //Distance to offset tooltip from the mouse location.
        ,   fixedTop = null //If not null, this fixes the top position of the tooltip.
        ,   classes = null  //Attaches additional CSS classes to the tooltip DIV that is created.
        ,   chartContainer = null   //Parent container that holds the chart.
        ,   position = {left: null, top: null}      //Relative position of the tooltip inside chartContainer.
        ;

        var contentGenerator = function(d) {
            if (content != null) return content;

            if (d == null) return '';

            var html = "<table><thead><strong class='x-value'>" + d.value + "</strong></thead><tbody>";
            if (d.series instanceof Array) {
                d.series.forEach(function(item) {
                    html += "<tr><td class='key'>" + item.key + ":</td>";
                    html += "<td class='value'>" + item.value + "</td></tr>"; 
                });
            }
            html += "</tbody></table>";
            return html;
        };

        //In situations where the chart is in a 'viewBox', re-position the tooltip based on how far chart is zoomed.
        function convertViewBoxRatio() {
            if (chartContainer) {
              var svg = d3.select(chartContainer).select('svg');
              var viewBox = (svg.node()) ? svg.attr('viewBox') : null;
              if (viewBox) {
                viewBox = viewBox.split(' ');
                var ratio = parseInt(svg.style('width')) / viewBox[2];
                
                position.left = position.left * ratio;
                position.top  = position.top * ratio;
              }
            }
        }


        //Draw the tooltip onto the DOM.
        nvtooltip.render = function() {
            convertViewBoxRatio();

            var left = position.left;
            var top = (fixedTop != null) ? fixedTop : position.top;

            if (chartContainer) {
                left += (chartContainer.offsetLeft || 0);
                top += (chartContainer.offsetTop || 0);
            }

            nv.tooltip.show([left, top],
                 contentGenerator(data), 
                 gravity, 
                 distance, 
                 document.getElementsByTagName('body')[0],
                 classes);
        };

        nvtooltip.content = function(_) {
            if (!arguments.length) return content;
            content = _;
            return nvtooltip;
        };

        nvtooltip.contentGenerator = function(_) {
            if (!arguments.length) return contentGenerator;
            if (typeof _ === 'function') {
                contentGenerator = _;
            }
            return nvtooltip;
        };

        nvtooltip.data = function(_) {
            if (!arguments.length) return data;
            data = _;
            return nvtooltip;
        };

        nvtooltip.gravity = function(_) {
            if (!arguments.length) return gravity;
            gravity = _;
            return nvtooltip;
        };

        nvtooltip.distance = function(_) {
            if (!arguments.length) return distance;
            distance = _;
            return nvtooltip;
        };

        nvtooltip.classes = function(_) {
            if (!arguments.length) return classes;
            classes = _;
            return nvtooltip;
        };

        nvtooltip.chartContainer = function(_) {
            if (!arguments.length) return chartContainer;
            chartContainer = _;
            return nvtooltip;
        };

        nvtooltip.position = function(_) {
            if (!arguments.length) return position;
            position.left = (typeof _.left !== 'undefined') ? _.left : position.left;
            position.top = (typeof _.top !== 'undefined') ? _.top : position.top;
            return nvtooltip;
        };

        nvtooltip.fixedTop = function(_) {
            if (!arguments.length) return fixedTop;
            fixedTop = _;
            return nvtooltip;
        };



        return nvtooltip;
  };

  //Global utility function to render a tooltip on the DOM.
  nv.tooltip.show = function(pos, content, gravity, dist, parentContainer, classes) {

            var container = document.createElement('div');
                container.className = 'nvtooltip ' + (classes ? classes : 'xy-tooltip');

            gravity = gravity || 's';
            dist = dist || 20;

            var body = parentContainer;
            if ( !parentContainer || parentContainer.tagName.match(/g|svg/i)) {
                //If the parent element is an SVG element, place tooltip in the <body> element.
                body = document.getElementsByTagName('body')[0];
            }

            container.innerHTML = content;
            container.style.left = 0;
            container.style.top = 0;
            container.style.opacity = 0;

            body.appendChild(container);

            var height = parseInt(container.offsetHeight),
                width = parseInt(container.offsetWidth),
                windowWidth = nv.utils.windowSize().width,
                windowHeight = nv.utils.windowSize().height,
                scrollTop = window.scrollY,
                scrollLeft = window.scrollX,
                left, top;

            windowHeight = window.innerWidth >= document.body.scrollWidth ? windowHeight : windowHeight - 16;
            windowWidth = window.innerHeight >= document.body.scrollHeight ? windowWidth : windowWidth - 16;

            var tooltipTop = function ( Elem ) {
                var offsetTop = top;
                do {
                    if( !isNaN( Elem.offsetTop ) ) {
                        offsetTop += (Elem.offsetTop);
                    }
                } while( Elem = Elem.offsetParent );
                return offsetTop;
            }

            var tooltipLeft = function ( Elem ) {
                var offsetLeft = left;
                do {
                    if( !isNaN( Elem.offsetLeft ) ) {
                        offsetLeft += (Elem.offsetLeft);
                    }
                } while( Elem = Elem.offsetParent );
                return offsetLeft;
            }

            switch (gravity) {
              case 'e':
                left = pos[0] - width - dist;
                top = pos[1] - (height / 2);
                var tLeft = tooltipLeft(container);
                var tTop = tooltipTop(container);
                if (tLeft < scrollLeft) left = pos[0] + dist > scrollLeft ? pos[0] + dist : scrollLeft - tLeft + left;
                if (tTop < scrollTop) top = scrollTop - tTop + top;
                if (tTop + height > scrollTop + windowHeight) top = scrollTop + windowHeight - tTop + top - height;
                break;
              case 'w':
                left = pos[0] + dist;
                top = pos[1] - (height / 2);
                if (tLeft + width > windowWidth) left = pos[0] - width - dist;
                if (tTop < scrollTop) top = scrollTop + 5;
                if (tTop + height > scrollTop + windowHeight) top = scrollTop - height - 5;
                break;
              case 'n':
                left = pos[0] - (width / 2) - 5;
                top = pos[1] + dist;
                var tLeft = tooltipLeft(container);
                var tTop = tooltipTop(container);
                if (tLeft < scrollLeft) left = scrollLeft + 5;
                if (tLeft + width > windowWidth) left = left - width/2 + 5;
                if (tTop + height > scrollTop + windowHeight) top = scrollTop + windowHeight - tTop + top - height;
                break;
              case 's':
                left = pos[0] - (width / 2);
                top = pos[1] - height - dist;
                var tLeft = tooltipLeft(container);
                var tTop = tooltipTop(container);
                if (tLeft < scrollLeft) left = scrollLeft + 5;
                if (tLeft + width > windowWidth) left = left - width/2 + 5;
                if (scrollTop > tTop) top = scrollTop;
                break;
            }


            container.style.left = left+'px';
            container.style.top = top+'px';
            container.style.opacity = 1;
            container.style.position = 'absolute'; //fix scroll bar issue
            container.style.pointerEvents = 'none'; //fix scroll bar issue

            return container;
    };

    //Global utility function to remove tooltips from the DOM.
    nv.tooltip.cleanup = function() {

              // Find the tooltips, mark them for removal by this class (so others cleanups won't find it)
              var tooltips = document.getElementsByClassName('nvtooltip');
              var purging = [];
              while(tooltips.length) {
                purging.push(tooltips[0]);
                tooltips[0].style.transitionDelay = '0 !important';
                tooltips[0].style.opacity = 0;
                tooltips[0].className = 'nvtooltip-pending-removal';
              }


              setTimeout(function() {

                  while (purging.length) {
                     var removeMe = purging.pop();
                      removeMe.parentNode.removeChild(removeMe);
                  }
            }, 500);
    };

})();
