#!/usr/bin/python

import argparse
import json
from string import Template

parser = argparse.ArgumentParser()
parser.add_argument("config", help="Name of the config to use")
args = parser.parse_args()

if args.config.endswith(".json"):
  config_file = "./config/{}".format(args.config)
else:
  config_file = "./config/{}.json".format(args.config)

server_xml_file = "./server.xml"
server_xml_template_file = "./server-template.xml"
indent = 19

def attributes_for_key_values(config):
  return ('\n' + ' ' * indent).join([ '{}="{}"'.format(k, v) for k,v in config.items() ])

with open(config_file, 'r') as c:
  config_from_json = json.load(c)
  with open(server_xml_template_file, 'r') as t:
    src = Template(t.read())
    result = src.substitute(config = attributes_for_key_values(config_from_json))
    with open(server_xml_file, 'w') as s:
      s.write(result)
