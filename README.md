# flux-spring
js spring animations

`npm i flux-spring`

```js
import spring = 'flux-spring';

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

function tick() {
    flux.update();
    requestAnimationFrame(tick);
}
tick();
```
