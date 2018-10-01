# Used by app engine to process the captcha requests

import webapp2
import urllib
import urllib2
import json

class HelloWebapp2(webapp2.RequestHandler):
    def get(self):
        self.response.headers.add_header('Access-Control-Allow-Origin', '*')
        self.response.headers['Content-Type'] = 'application/json'
        self.response.write('')

    def post(self):
        self.response.headers.add_header('Access-Control-Allow-Origin', '*')
        self.response.headers['Content-Type'] = 'application/json'

        recaptcha_response_field = self.request.get('captcha')
        recaptcha_private_key = 'TODO' # put recaptcha private key here
        
        url = 'https://www.google.com/recaptcha/api/siteverify'
        values = {
            "secret":  recaptcha_private_key,
            "response": recaptcha_response_field
        }
        
        data = urllib.urlencode(values)
        req = urllib2.Request(url, data)
        response = urllib2.urlopen(req)
        result = json.load(response)
        
        if result['success']:
            self.response.write("200")
        else:
            self.abort(400)
        
        url = 'TODO'
        body = {
            "domain":  self.request.get('malicious'),
            "incidentType": "domain",
            "reasoning": self.request.get('comment'),
            "safeDomain": 'target': self.request.get('target'),
            "source": "mailbox:chrome-plugin"
        }
  

    def options(self):      
        self.response.headers['Access-Control-Allow-Origin'] = '*'
        self.response.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept'
        self.response.headers['Access-Control-Allow-Methods'] = 'POST, GET, PUT, DELETE'

app = webapp2.WSGIApplication([
    ('/', HelloWebapp2),
], debug=True)

def main():
    from paste import httpserver
    httpserver.serve(app, host='127.0.0.1', port='8080')

if __name__ == '__main__':
    main()
