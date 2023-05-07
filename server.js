const http = require('http');
const libUrl = require('url');
const path = require('path');
const { JSONFileManager } = require('./src/jsonFileManager');
const { generateId } = require('./utils/utils');

const dataFileManager = new JSONFileManager(path.resolve('data/data.json'));

const requestListener = async (req, res) => {
  /**
   * Set response dengan status code, pesan, dan hasil yang diberikan
   * @param {number} statusCode - Kode status HTTP
   * @param {string} message - Pesan yang ingin disampaikan
   * @param {boolean} error - Jika terjadi error, bernilai true, jika tidak maka false
   * @param {Array|Object} results - Hasil yang ingin dikirimkan ke client
   * @param {string} contentType - Tipe konten yang dikirimkan dalam response
   * @returns {Object} - Response dengan status code, message, error, results, dan contentType yang ditentukan
   */
  const setResponse = (statusCode, message, results, error = false, contentType = 'application/json') => {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', contentType);
    if (contentType == 'application/json') {
      if (results) {
        res.end(
          JSON.stringify({
            message: message,
            error: error,
            results: results,
          })
        );
      } else {
        res.end(
          JSON.stringify({
            message: message,
            error: error,
          })
        );
      }
    } else {
      res.end(message);
    }
  };

  const { method, url } = req;
  const { pathname, query } = libUrl.parse(url, true);
  const id = query.id;

  if (pathname === '/produk') {
    if (id) {
      if (method === 'GET') {
        const oneData = (await dataFileManager.readOneData(id)) || `Data produk dengan id ${id} tidak dapat ditemukan!.`;
        setResponse(200, 'OK!', oneData);
      } else if (method === 'PUT') {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });
        req.on('end', async () => {
          body = JSON.parse(body);
          if (body.nama && body.harga && body.kuantitas) {
            const { nama, harga, kuantitas } = body;
            let updatedData = { id, nama, harga, kuantitas };
            let isUpdated = await dataFileManager.updateData(updatedData);
            isUpdated ? setResponse(200, 'OK!', updatedData) : setResponse(404, 'Not found!.', null, true);
            return;
          }
          setResponse(400, 'Bad request!.', null, true);
        });
      } else if (method === 'DELETE') {
        let isDeleted = await dataFileManager.deleteData(id);
        isDeleted ? setResponse(200, 'OK!', null) : setResponse(404, 'Not found!.', null, true);
      } else {
        setResponse(405, `Method '${method}' is not allowed for path '/produk?id={idProduk}'`, null, true);
      }
    } else if (!id) {
      if (method === 'GET') {
        const allData = (await dataFileManager.readAllData()).length ? await dataFileManager.readAllData() : 'Belum ada data produk.';
        setResponse(200, 'OK!', allData);
      } else if (method === 'POST') {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });
        req.on('end', () => {
          body = JSON.parse(body);
          if (body.nama && body.harga && body.kuantitas) {
            const { nama, harga, kuantitas } = body;
            let newData = { id: generateId(), nama, harga, kuantitas };
            dataFileManager.addData(newData);
            setResponse(201, 'Created', newData);
            return;
          }
          setResponse(400, 'Bad request!.', null, true);
        });
      } else {
        setResponse(405, `Method '${method}' is not allowed for path '/produk'. Please give id as params.`, null, true);
      }
    }
  } else {
    setResponse(404, '<p>Page not found</p>', null, false, 'text/html');
  }
};

const server = http.createServer(requestListener);

const port = 5000;
const host = 'localhost';

server.listen(port, host, () => {
  console.log(`Server berjalan pada http://${host}:${port}`);
});
