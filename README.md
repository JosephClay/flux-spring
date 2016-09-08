# flux-spring

js spring animations

`npm install flux-spring`

## Usage

```js
const spring = require('flux-spring');

// animate a DOM element
spring(element)
    .to({ x: 50 })
    .repeat(Infinity)
    .yoyo()
    // use flux.transform to update the
    // element with a 2d or 3d matrix
    .on('update', spring.transform)
    .start();

// animate an object's properties
spring({ x: 0 })
    .to({ x: 50 })
    // change the velocity, tension and
    // friction of the spring
    .velocity(0).tension(80).friction(8)
    .on('update', function(values) {
        console.log(values.x);
    })
    .start();

// raf loop
function tick() {
    spring.update();
    requestAnimationFrame(tick);
}
tick();
```

## Tests

`npm test`

For a visual test:

- `npm start`
- [localhost:1777](http://localhost:1777/)

## License

MIT License

Copyright (c) 2016 Joseph Clay

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.