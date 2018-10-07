


### Refactors

* Remove jQuery
* Stop passing around URL everywhere
* Figure out a better way than doing isServer, inNode everywhere
* Handling URL and path between Node and Browser
* Get away from Grunt, use gulp or vanilla
* Refactor input.js so it handles more input and it isn't scattered everywhere
* Make Parts out of the OimoScene and WSScene to make the code more readbile and find a better way to pass parameters
* Use await instead of then and Promise api directly
 * Wrap THREE and other async things that use callbacks