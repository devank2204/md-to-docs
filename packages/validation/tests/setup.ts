// Isolated jsdom mock for SVG elements to allow Mermaid to render in headless testing environments

if (typeof window !== 'undefined') {
  if (typeof SVGElement !== 'undefined') {
    if (!SVGElement.prototype.getBBox) {
      SVGElement.prototype.getBBox = function () {
        // Return realistic dummy dimensions based on text length or tag
        const textLen = (this.textContent || '').length;
        const width = textLen > 0 ? textLen * 8 + 20 : 100;
        const height = 40;
        return {
          x: 0,
          y: 0,
          width,
          height,
          top: 0,
          right: width,
          bottom: height,
          left: 0,
          toJSON() {
            return this;
          },
        };
      };
    }

    if (!SVGElement.prototype.getScreenCTM) {
      SVGElement.prototype.getScreenCTM = function () {
        return {
          a: 1,
          b: 0,
          c: 0,
          d: 1,
          e: 0,
          f: 0,
          inverse() {
            return this;
          },
          multiply() {
            return this;
          },
        };
      };
    }
  }

  if (typeof SVGSVGElement !== 'undefined') {
    if (!SVGSVGElement.prototype.createSVGPoint) {
      SVGSVGElement.prototype.createSVGPoint = function () {
        return {
          x: 0,
          y: 0,
          matrixTransform() {
            return this;
          },
        };
      };
    }

    if (!SVGSVGElement.prototype.createSVGMatrix) {
      SVGSVGElement.prototype.createSVGMatrix = function () {
        return {
          a: 1,
          b: 0,
          c: 0,
          d: 1,
          e: 0,
          f: 0,
          inverse() {
            return this;
          },
          multiply() {
            return this;
          },
        };
      };
    }
  }
}
