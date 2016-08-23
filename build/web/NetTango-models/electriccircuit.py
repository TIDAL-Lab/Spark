import cgi
import urllib
import webapp2
import json
import jinja2
import os


from google.appengine.api import users
from google.appengine.ext import ndb



JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    extensions=['jinja2.ext.autoescape'])
'''
jinja_environment = jinja2.Environment(autoescape=True,
    loader=jinja2.FileSystemLoader(os.path.join(os.path.dirname(__file__), 'models')))
'''
DEFAULT_SESSION_KEY = 'default_session'

def session_key(session=DEFAULT_SESSION_KEY):
    return ndb.Key('Session', session)

class Circuit_Components(ndb.Model):
    """Models an individual Electric Circuit entry with components (JSON), and date."""
    components = ndb.JsonProperty()
    date = ndb.DateTimeProperty(auto_now_add=True)



class Electric_Circuit(webapp2.RequestHandler):

    def get(self):
        frameID = int(self.request.get('frameID'))

        # option can be either 0 or 1 
        # option = 0 -> we will respond to the request with component info
        # option = 1 -> we will respond by redirect user to the models
        option = int(self.request.get('o'))
        
        session= DEFAULT_SESSION_KEY
        components_query = Circuit_Components.query(
            ancestor=session_key(session)).order(-Circuit_Components.date)
        components = components_query.fetch(1)
        #component_list = ''

        for component in components:
            component_list = component.components
            
        #convert JSON string to JSON Object
        components_array = json.loads(component_list)

        #response depends on options
        if (option == 1):
            for component in components_array:
                if component['frameID'] == frameID:
                    model = component['type']
                    r = component['resistance']
                    i = component['current']
                    v = component['voltageDrop']

                    query_param = {'r' : r,
                                   'i' : i,
                                   'v' : v }

                    if (model == 'Bulb'):
                        self.redirect('/Bulb?'+ urllib.urlencode(query_param))
                    elif (model == 'Wire'):
                        self.redirect('/Wire?'+ urllib.urlencode(query_param))
                    else:
                        self.redirect('/Resistor?'+ urllib.urlencode(query_param))
                    break
        else:
            self.response.write(component_list)


    def post(self):
        # Receving data from Dart
        # Data is in JSON form
        # here we are storing data in google-app-engine server
        session= DEFAULT_SESSION_KEY
        electricComponents = Circuit_Components(parent=session_key(session))
        electricComponents.components = self.request.get(self.request.arguments()[0])
        electricComponents.put()
        
        #query_params = {'Session': session}
        #self.redirect('/?' + urllib.urlencode(query_params))


class Bulb(webapp2.RequestHandler):

    def get(self):
        
        r = self.request.get('r')
        i = self.request.get('i')
        v = self.request.get('v')

        
	template_values = {
            'r': r,
            'i': i,
            'v': v,
        }

        template = JINJA_ENVIRONMENT.get_template('resistor.html')
        self.response.out.write(template.render(template_values))

class Wire(webapp2.RequestHandler):

    def get(self):

        r = self.request.get('r')
        i = self.request.get('i')
        v = self.request.get('v')

        template_values = {
            'r': r,
            'i': i,
            'v': v,
        }

        template = JINJA_ENVIRONMENT.get_template('wire.html')
        self.response.out.write(template.render(template_values))

class Resistor(webapp2.RequestHandler):

    def get(self):

        r = self.request.get('r')
        i = self.request.get('i')
        v = self.request.get('v')

        template_values = {
            'r': r,
            'i': i,
            'v': v,
        }

        template = JINJA_ENVIRONMENT.get_template('resistor.html')
        self.response.out.write(template.render(template_values))


class Circuit(webapp2.RequestHandler):

    def get(self):
        template_values = { }
        template = JINJA_ENVIRONMENT.get_template('circuit-web/index.html')
        self.response.out.write(template.render(template_values))


application = webapp2.WSGIApplication([
    ('/', Electric_Circuit),
    ('/Bulb', Bulb),
    ('/Wire', Wire),
    ('/Resistor', Resistor),
    ('/Circuit', Circuit),
], debug=True)

