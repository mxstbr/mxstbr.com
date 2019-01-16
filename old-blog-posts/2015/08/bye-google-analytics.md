export const frontmatter = {
  "published": true,
  "title": "Bye Bye Google Analytics",
  "tags": "privacy google analytics"
};



A few days ago, I got rid of Google Analytics on [all of my websites](https://github.com/mxstbr), and moved all my analytics needs to a self–hosted instance of [Open Web Analytics](https://github.com/padams/Open-Web-Analytics).

The main reason for doing this is the privacy of the visitors of the websites — while some people are okay with (or do not care/know about) being tracked by Google wherever they go, some might not be, and it is not much effort to run your own analytics server.

OWA is a very well maintained product, and is basically equal to Google Analytics in terms of core functionality. (Page views, Acquisition, Events/Actions, etc.) Open Web Analytics has a [full comparison](http://www.openwebanalytics.com/?page_id=158) which you can have a look at and see if it has all the functionality you need.

Here is how I did it:

1. Acquire a server running PHP & MySQL
I chose [DigitalOcean](https://www.digitalocean.com/?refcode=d371ed7f99af) (referral link) for this, as they offer cheap options which are perfect for the small needs of an analytics server. 
I set up the 5$/month option, running Ubuntu 14.04 and the LAMP (Linux, Apache, MySQL, PHP) stack. 

2. Create the database and user for Open Web Analytics
Assuming you went with the LAMP stack and are now using MySQL, this is what you have to do to get your server ready for OWA. First, create a database to store your analytics data.
```SQL
CREATE DATABASE analytics;
```
Then create the user OWA is going to use to access the data.
```SQL
CREATE USER 'openwebanalytics'@'localhost' IDENTIFIED BY 'somepassword';
```
Now the user exists, but they do not have  access to the database. Lets fix that:
```SQL
GRANT ALL PRIVILEGES ON analytics.* TO 'openwebanalytics'@'localhost';
```
Now we just need to reload the permission for the new setup to come into effect.
```SQL
FLUSH PRIVILEGES;
```

3. Download Open Web Analytics
If you do not have it already, install `git` on your server by running 
```
apt-get install git
```
Change into your web servers root folder, which is `/var/www/html` on my droplet
```
cd /var/www/html
```
and download OWA into that folder with git.
```
git clone git@github.com:padams/Open-Web-Analytics
```
Make sure the www-data user (which OWA uses) has the right file permissions set up before continuing by running the following commands (replacing /var/www/html with your web servers root folder):
```
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html
```

4. Install Open Web Analytics
OWA thankfully comes with a very handy installer, so you just have to open `http://yourdomain.com/install.php` in your browser and follow the steps.
When asked for the database credentials, the database name is `analytics`, the username `openwebanalytics` and the password whatever you set it to.

5. Track your website with Open Web Analytics
The only step remaining is dropping the tracking code into your HTML files:
```HTML
<script type="text/javascript">
//<![CDATA[
var owa_baseUrl = 'http://your.domain.com/path/to/owa/';
var owa_cmds = owa_cmds || [];
owa_cmds.push(['setSiteId', 'your_site_id']);
owa_cmds.push(['trackPageView']);
owa_cmds.push(['trackClicks']);
owa_cmds.push(['trackDomStream']);
 
(function() {
	var _owa = document.createElement('script'); _owa.type = 'text/javascript'; _owa.async = true;
	_owa.src = owa_baseUrl + 'modules/base/js/owa.tracker-combined-min.js';
	var _owa_s = document.getElementsByTagName('script')[0]; _owa_s.parentNode.insertBefore(_owa, _owa_s);
}());
//]]>
</script>
```
Don't forget to replace the `owa_baseUrl` with your domain and to set the correct site id!

Congratulations, you are now tracking your website with Open Web Analytics!

*This post was originally published on [N-O-D-E.net](http://n-o-d-e.net/post/125924418696/how-to-ditch-google-analytics-and-run-your-own).*