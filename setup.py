from setuptools import setup, find_packages

with open('requirements.txt') as f:
	install_requires = f.read().strip().split('\n')

# get version from __version__ variable in spreads/__init__.py
from spreads import __version__ as version

setup(
	name='spreads',
	version=version,
	description='Spreads',
	author='jan',
	author_email='janlloydangeles@gmail.com',
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
