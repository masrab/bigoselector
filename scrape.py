import requests
from bs4 import BeautifulSoup

page = requests.get('http://bigocheatsheet.com/')


soup = BeautifulSoup(page.text)


tab = soup.find(id='data-structures').find_next('table')

# list of list of rows
rows = []
for i, row in enumerate(tab.find_all('tr')):
	if i>1: #skip the first two rows
		rows.append([cell.text for cell in row.find_all(['td', 'th'])])

with open('data-structures.txt', 'w') as f:
    f.writelines([','.join(row)+'\n' for row in rows])

# repeat for Heap
tab = soup.find(id='heaps').find_next('table')

# list of list of rows
rows = []
for i, row in enumerate(tab.find_all('tr')):
	if i>0: #skip the first rows
		rows.append([cell.text for cell in row.find_all(['td', 'th'])])

with open('heaps.txt', 'w') as f:
    f.writelines([','.join(row)+'\n' for row in rows])

