using System;
using System.Data;
using System.Data.OleDb;
using System.IO;
using System.Text;

namespace BridgeConverter
{
    internal static class ConvertResults
    {

        public static void ConvertToCSV(string dbfFile)
        {
            var filepath = Path.GetDirectoryName(dbfFile);
            var fileName = Path.GetFileName(dbfFile);
            string constr =
                "Provider=Microsoft.Jet.OLEDB.4.0;Data Source=" + filepath + ";Extended Properties=dBASE IV;User ID=Admin;Password=;";
            using (var con = new OleDbConnection(constr))
            {
                var sql = "select * from " + dbfFile;
                var cmd = new OleDbCommand(sql, con);
                con.Open();
                var ds = new DataSet();
                var da = new OleDbDataAdapter(cmd);
                da.Fill(ds);

                var csv = new StringBuilder();
                string headerLine = null;

                foreach (var column in ds.Tables[0].Columns)
                {
                    headerLine += column + ",";

                }
                csv.AppendLine(headerLine);
                foreach (var row in ds.Tables[0].Rows)
                {
                    // write row to csv
                    var mrow = row as DataRow;

                    if (mrow != null)
                    {
                        var positionField = mrow["HUIDPLAATS"] as String;
                        if (positionField != null)
                        {
                            var xy = positionField.Split('/');
                            mrow["HUIDPLAATS"] = (Int32.Parse(xy[0]) + 88353) + "/" + (Int32.Parse(xy[1]) + 363995);
                        }
                        var newLine = string.Join(",", mrow.ItemArray);
                        csv.AppendLine(newLine);
                    }
                }

                //after your loop
                var csvFileName = Path.ChangeExtension(dbfFile, "csv");
                File.WriteAllText(csvFileName, csv.ToString());

            }


        }
    }
}
