export const frontmatter = {
  "published": true,
  "layout": "post",
  "comments": true,
  "title": "My Front-End Development Workflow",
  "tags": "Frontend Setup"
};



It all started when I tried out [Sublime Text](http://sublimetext.com) - and loved it. It's brilliant features along with it's great plugin ecosystem make this code editor my definite favorite. It is available cross-platform for Mac, Windows and Linux, and it's free!

With a simple "CTRL-S", all my changed files get compiled, minified, saved and then uploaded to my Web Server. I don't even need to refresh my browser to see the changes! I almost never have to move my hand to my mouse anymore, almost all navigation in Sublime Text can be done with the keyboard. This saves time and energy, and my efficiency and immersion into the code noticeably went up after I started using it. All of this is possible because of a selected handful of excellent plugins and built-in commands.

<!--break-->

## Essential Vanilla Sublime Text Features & Commands

### The Command Palette

The most important shortcut is `CTRL + Shift + p`, which opens the Command Palette. From here, you can handle your project, change the syntax of the current file and even use git! E.g., to initialize git in the current directory, just press `CTRL + Shift + P`, type `git init' and you're done. Committing, adding, branching and pushing can be done without leaving your code editor and opening the command line, which is great for full immersion into your project.

### File Switching

To quickly change between files, use `CTRL + P`, which opens a similar bar like the command palette. Instead of issuing different commands, with the `CTRL + P` command you can search and open files in the integrated file explorer. You just start typing the name of the file you want to open, and press `Enter` as soon as Sublime found it with its fuzzy search algorithm. (It almost seems to know which file I want to open!)

###  Multiple Cursors

This is one of the hardest concepts to grasp when starting off with Sublime Text, but once you get the hang of it you never want to work with another code editor again. Basically, it allows you to edit multiple words in different lines of your file at the same time, just as if you had multiple cursors. 

The easiest way to use it is `CTRL + Click`, which you can place multiple cursors with. Then you can write at different positions in your code at the same time, so you don't have to repeatedly write the same thing over and over. Wait, didn't I tell you, your hand won't have to leave the keyboard anymore for full immersion? You're right, that's why there's two more keyboard shortcuts which make your life easier.

`CTRL + D` is the first one. When you click it for the first time, it selects the word your cursor is placed in. The magic starts happening when you press it multiple times. Sublime Text finds every occurrence of the selected word, and with every press of `CRTL + D` it selects the next one! E.g., if you want to change the name of a variable, all you have to do is select it, press `CTRL + D` a bunch times and write the new one! 

Now, if you've coded for a bit you might say "Well, that's great, but if I want to do that in my editor of choice, I just have to search & replace. That's about a million times better than clicking CTRL + D a hundred times because your main variable changed!" Don't worry, Sublime has got you covered. Just select the first word and press `ALT + F3`, and it selects every single occurrence. 

Sounds good, but what about all those amazing plugins I promised? Don't shy away, we're already there!

## Plugins

### [Package Control](https://sublime.wbond.net/installation)

There is no way around this plugin. With this one installed, you can manage your plugins via the Command Palette (`CTRL + Shift + P`). To install a new plugin, you just open the Command Palette, type `Install`, press `Enter` when `Install Package` is selected and search for the plugin you want. With that out of the way, on to the nitty-gritty stuff!

###  [Emmet (previously called Zen Coding)](http://emmet.io)

I could not write HTML without this tool anymore. If you want to create a div with the class ".nav", and an unordered list with 6 links inside, instead of having to type all of it by hand, with Emmet you just type `div.nav>ul>li*6>a` and press `TAB`. That's it, the structure magically appears and you just have to fill it up with content. This can of course be done for any HTML you want to write, which saves time 

### [SASS Build System](https://github.com/jaumefontal/SASS-Build-SublimeText2)

Just like the name suggests, with SASS Build System you can build your .scss and .sass files without leaving sublime or your keyboard. You just install the plugin, press `CTRL + B` when you have your SASS files open and it automatically builds a style.css for you. If there's errors, they get reported in the inbuilt console and you can fix them before saving the next time.

While that is a great feature to have, you still have to press two buttons. That's a lot for an action that could be done on save, you say? Well, look no further, this is the right plugin for the job:

### [Sublime Build On Save](https://github.com/alexnj/SublimeOnSaveBuild)

Again, the name fits the functionality perfectly. When you have SASS Build System and SublimeBuildOnSave installed, all you have to do is `CTRL + S` save your SASS file, and it builds the thing, all on its own. You then get a style.css file with all your sassy stuff inside, which you reference in your HTML and you're good to go!

### [Live Reload](http://livereload.com/)

This is one of the most famous plugins for Sublime Text. LiveReload is not only a plugin for Sublime, but it also is a browser extension. If you open a .html file locally, and save anything related to it (either the file itself or the .css file/s associated inside), your browser automatically reloads and displays the changes you made. No need for you to press `CTRL + R`, just save, `CTRL + TAB' to your browser of choice and look how the new color changes the feel of the page.

### [Sublime SFTP](http://wbond.net/sublime_packages/sftp)

This is the plugin that ties everything together. Sublime SFTP establishes a connection to your web server, and a specified folder on that server. When you change something and save the file, Sublime SFTP will automatically upload the file to the right location, LiveReload will refresh the page (this is configurable in LiveReload, so it works with remote pages aswell) and you will see the page as it is on the web. Absolutely amazing, no need to use WinSCP or FileZilla or any of the other tools anymore, just save your changes and thats it!

## Conclusion

This was a lot to digest, and of course is only one of the many possible workflows in the Front-End Development world. If you have any suggestions, feedback or general comments, either write your thoughts on here or write me on [twitter](https://twitter.com/mstoiber05)!