# Unsupported Constructs and Graceful Degradation

This fixture verifies that unsupported or hostile constructs do not crash the parser or renderers, and degrade gracefully without silently dropping content.

## Raw HTML Canvas and Video Tags
<video width="320" height="240" controls>
  <source src="movie.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

<canvas id="myCanvas" width="200" height="100"></canvas>

## Custom Directives
:::unknown-directive{attr="value"}
This is an experimental directive body that should be handled gracefully.
:::

## Deeply Nested Lists Beyond Normal Depth
1. Level 1
   1. Level 2
      1. Level 3
         1. Level 4
            1. Level 5
               - Deep leaf item that tests list indentation overflow.
